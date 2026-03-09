import cv2
import numpy as np
import time
import requests
import easyocr
import re
import os
import sys
import json
import threading
from ultralytics import YOLO
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ═══════════════════════════════════════════════════════════
#  CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════
CAMARA_URL       = os.getenv("DROIDCAM_URL", "http://10.168.201.178:4747/video")
LINEA_1_Y        = 160
LINEA_2_Y        = 290
DISTANCIA_METROS = 5.0
VELOCIDAD_LIMITE = 60
API_URL          = "http://localhost:3005/api/v1/trafico/infracciones"
COOLDOWN_SEG     = 10
CARPETA_FOTOS    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fotos_infracciones")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "AIzaSyAMtHZnSEkgr2XzQuHKu7k4lAkMv3Euzqs")

# ═══════════════════════════════════════════════════════════
#  COLORES HSV
# ═══════════════════════════════════════════════════════════
COLORES_HSV = {
    "Rojo":      [([0,   120,  60], [10,  255, 255]),
                  ([165, 120,  60], [180, 255, 255])],
    "Naranja":   [([11,  100,  60], [25,  255, 255])],
    "Amarillo":  [([26,   80,  80], [34,  255, 255])],
    "Verde":     [([35,   60,  40], [85,  255, 255])],
    "Azul":      [([86,   80,  80], [130, 255, 255])],
    "Morado":    [([131,  60,  40], [164, 255, 255])],
    "Blanco":    [([0,    0,  200], [180,  25, 255])],
    "Gris":      [([0,    0,   70], [180,  40, 200])],
    "Negro":     [([0,    0,    0], [180, 255,  45])],
    "Plateado":  [([0,    0,  170], [180,  30, 220])],
}

def detectar_color_roi(roi):
    if roi is None or roi.size == 0:
        return "No identificado"
    h = roi.shape[0]
    roi_mid = roi[int(h*0.15):int(h*0.75), :]
    if roi_mid.size == 0:
        return "No identificado"
    hsv      = cv2.cvtColor(roi_mid, cv2.COLOR_BGR2HSV)
    total_px = roi_mid.shape[0] * roi_mid.shape[1]
    conteos  = {}
    for nombre, rangos in COLORES_HSV.items():
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for (lo, hi) in rangos:
            mask = cv2.bitwise_or(mask, cv2.inRange(hsv, np.array(lo), np.array(hi)))
        conteos[nombre] = cv2.countNonZero(mask)
    mejor = max(conteos, key=conteos.get)
    pct   = (conteos[mejor] / total_px) * 100
    return mejor if pct > 15 else "No identificado"

# ═══════════════════════════════════════════════════════════
#  INICIALIZAR MODELOS
# ═══════════════════════════════════════════════════════════
print("Cargando YOLO...", flush=True)
yolo_model = YOLO('yolov8n.pt')
print("✅ YOLO listo", flush=True)

print("Cargando EasyOCR...", flush=True)
ocr_reader = easyocr.Reader(['es', 'en'], gpu=False)
print("✅ EasyOCR listo", flush=True)

gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini configurado", flush=True)
else:
    print("⚠️  Sin GEMINI_API_KEY — Gemini desactivado", flush=True)

os.makedirs(CARPETA_FOTOS, exist_ok=True)

# ═══════════════════════════════════════════════════════════
#  OCR DE PLACA
# ═══════════════════════════════════════════════════════════
_ocr_busy = False

def leer_placa_roi(roi):
    try:
        if roi is None or roi.size == 0:
            return None, 0
        h, w = roi.shape[:2]
        big  = cv2.resize(roi, (w * 3, h * 3))
        gray = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
        _, bw1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        bw2    = cv2.bitwise_not(bw1)
        bw3    = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, 11, 2)
        mejor_texto, mejor_conf = None, 0
        for img in [bw1, bw2, bw3]:
            res = ocr_reader.readtext(
                img,
                allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                detail=1, paragraph=False,
            )
            for (_, txt, conf) in res:
                t = re.sub(r'[^A-Z0-9\-]', '', txt.upper())
                es_placa = (
                    re.match(r'^[A-Z]-\d{3}[A-Z]{2,3}$', t) or
                    re.match(r'^\d{3}-[A-Z]{3}$', t)         or
                    re.match(r'^[A-Z]{1,3}-?\d{3,4}$', t)    or
                    (len(t) >= 5 and conf > 0.45)
                )
                if es_placa and conf > mejor_conf:
                    mejor_texto = t
                    mejor_conf  = conf
        return mejor_texto, mejor_conf
    except Exception as e:
        print(f"⚠️ OCR error: {e}", flush=True)
        return None, 0

def leer_placa_async(frame_crop, auto_id, autos_dict):
    global _ocr_busy
    if _ocr_busy:
        return
    def _run():
        global _ocr_busy
        _ocr_busy = True
        try:
            texto, conf = leer_placa_roi(frame_crop)
            if texto and auto_id in autos_dict:
                autos_dict[auto_id]['placa'] = texto
                print(f"🔍 Placa OCR: {texto} ({conf:.0%})", flush=True)
        finally:
            _ocr_busy = False
    threading.Thread(target=_run, daemon=True).start()

# ═══════════════════════════════════════════════════════════
#  GEMINI
# ═══════════════════════════════════════════════════════════
def analizar_foto_gemini(foto_path, placa_ocr, callback):
    if gemini_client is None:
        callback("No identificado", "No identificado", "No identificado", placa_ocr)
        return

    def _run():
        try:
            if not foto_path or not os.path.exists(foto_path):
                print(f"⚠️ Foto no encontrada: {foto_path}", flush=True)
                callback("No identificado", "No identificado", "No identificado", placa_ocr)
                return

            with open(foto_path, 'rb') as f:
                img_bytes = f.read()

            prompt = (
                "Eres un experto en identificación de vehículos de Guatemala. "
                "Analiza esta foto de una infracción de tráfico con mucho detalle. "
                "Responde ÚNICAMENTE en este formato exacto, sin texto adicional:\n"
                "MODELO: [marca y modelo exacto, ej: Chevrolet Spark, Toyota Corolla]\n"
                "AÑO: [año exacto o rango, ej: 2015-2018]\n"
                "COLOR: [color principal del vehículo]\n"
                "PLACA: [número de placa exacto que ves en la imagen]\n"
                "\n"
                "Si no puedes identificar un campo escribe: No identificado\n"
                "Para la PLACA si no la ves claramente escribe: No visible"
            )

            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )

            texto = response.text
            print(f"🤖 Gemini:\n{texto.strip()}", flush=True)

            modelo = anio = color = placa_g = None
            for linea in texto.split('\n'):
                l = linea.strip()
                if l.startswith('MODELO:'):
                    modelo  = l.replace('MODELO:', '').strip()
                elif l.startswith('AÑO:'):
                    anio    = l.replace('AÑO:', '').strip()
                elif l.startswith('COLOR:'):
                    color   = l.replace('COLOR:', '').strip()
                elif l.startswith('PLACA:'):
                    placa_g = l.replace('PLACA:', '').strip()
                    if placa_g and placa_g.lower() in ['no visible', 'no identificado', 'no identificada']:
                        placa_g = None

            placa_final = placa_ocr or placa_g or None
            callback(
                modelo or "No identificado",
                anio   or "No identificado",
                color  or "No identificado",
                placa_final,
            )

        except Exception as e:
            print(f"⚠️ Gemini error: {e}", flush=True)
            callback("No identificado", "No identificado", "No identificado", placa_ocr)

    threading.Thread(target=_run, daemon=True).start()

# ═══════════════════════════════════════════════════════════
#  GUARDAR FOTO
# ═══════════════════════════════════════════════════════════
def guardar_foto(frame, placa, x1, y1, x2, y2):
    try:
        ts     = time.strftime("%Y%m%d_%H%M%S")
        nombre = os.path.join(CARPETA_FOTOS, f"{placa}_{ts}.jpg")
        foto   = frame.copy()
        cv2.rectangle(foto, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(foto, f"INFRACTOR: {placa}",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(foto, time.strftime("%d/%m/%Y %H:%M:%S"),
                    (10, foto.shape[0] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 2)
        cv2.imwrite(nombre, foto, [cv2.IMWRITE_JPEG_QUALITY, 95])
        print(f"📸 Foto: {nombre}", flush=True)
        return nombre
    except Exception as e:
        print(f"⚠️ Error foto: {e}", flush=True)
        return None

# ═══════════════════════════════════════════════════════════
#  ENVIAR INFRACCIÓN
# ═══════════════════════════════════════════════════════════
multas_count = 0

def enviar_infraccion(placa, velocidad, paso_rojo, modelo, anio, color, foto_path):
    global multas_count
    try:
        payload = {
            "placa":     placa     or "NO-DETECTADA",
            "velocidad": round(float(velocidad), 2),
            "paso_rojo": paso_rojo,
            "modelo_ia": modelo    or "No identificado",
            "anio_ia":   anio      or "No identificado",
            "color_ia":  color     or "No identificado",
            "foto":      foto_path or "",
        }
        resp = requests.post(API_URL, json=payload, timeout=30)
        if resp.status_code == 201:
            data    = resp.json()
            reporte = data.get("reporte", {})
            multas_count += 1
            print(f"\n{'='*55}", flush=True)
            print(f"  🚨  MULTA #{multas_count} REGISTRADA", flush=True)
            print(f"{'='*55}", flush=True)
            print(f"  Placa      : {reporte.get('placa',           'N/A')}", flush=True)
            print(f"  Modelo     : {reporte.get('modelo',          'N/A')}", flush=True)
            print(f"  Año        : {reporte.get('anio',            'N/A')}", flush=True)
            print(f"  Color      : {reporte.get('color',           'N/A')}", flush=True)
            print(f"  Infracción : {reporte.get('tipo_infraccion', 'N/A')}", flush=True)
            print(f"  Monto      : {reporte.get('monto_multa',     'Q0')}", flush=True)
            print(f"  Foto       : {foto_path or 'N/A'}", flush=True)
            print(f"{'='*55}\n", flush=True)
        else:
            print(f"❌ Servidor: {resp.status_code} — {resp.text[:120]}", flush=True)
    except requests.exceptions.ConnectionError:
        print("❌ Node.js no está corriendo.", flush=True)
    except Exception as e:
        print(f"❌ Error envío: {e}", flush=True)

# ═══════════════════════════════════════════════════════════
#  PROCESAR INFRACCIÓN (en hilo)
# ═══════════════════════════════════════════════════════════
def procesar_infraccion(frame, x1, y1, x2, y2, velocidad, paso_rojo,
                         placa_ocr, color_hsv, foto_existente=None):
    placa_tmp = placa_ocr or f"TMP-{int(time.time()) % 9999:04d}"
    # Usar foto anticipada si ya existe, si no tomar nueva
    foto_path = foto_existente or guardar_foto(frame, placa_tmp, x1, y1, x2, y2)

    def on_gemini(modelo, anio, color_g, placa_g):
        placa_final = placa_ocr or placa_g or "No identificada"
        if placa_final and not placa_final.startswith("TMP-"):
            placa_final = re.sub(r'[^A-Z0-9\-]', '', placa_final.upper())
        color_final = color_hsv if color_hsv and color_hsv != "No identificado" else color_g
        nonlocal foto_path
        if foto_path and placa_tmp != placa_final:
            nuevo_nombre = foto_path.replace(placa_tmp, placa_final)
            try:
                os.rename(foto_path, nuevo_nombre)
                foto_path = nuevo_nombre
            except Exception:
                pass
        enviar_infraccion(placa_final, velocidad, paso_rojo, modelo, anio, color_final, foto_path)

    if foto_path:
        analizar_foto_gemini(foto_path, placa_ocr, on_gemini)
    else:
        enviar_infraccion(
            placa_ocr or "No identificada", velocidad, paso_rojo,
            "No identificado", "No identificado",
            color_hsv or "No identificado", foto_path
        )
# ═══════════════════════════════════════════════════════════
#  CÁMARA
# ═══════════════════════════════════════════════════════════
def abrir_camara(url):
    cap = cv2.VideoCapture(url)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap

cap = abrir_camara(CAMARA_URL)
print(f"Cámara abierta: {cap.isOpened()}", flush=True)
print("💡 R = semáforo ROJO/VERDE   Q = salir", flush=True)
print(f"📁 Fotos en: {os.path.abspath(CARPETA_FOTOS)}", flush=True)

# ═══════════════════════════════════════════════════════════
#  VARIABLES GLOBALES
# ═══════════════════════════════════════════════════════════
autos_rastreados = {}
multas_enviadas  = set()
multas_lock      = threading.Lock()
frame_count      = 0
yolo_results     = None
semaforo_manual  = False

# ═══════════════════════════════════════════════════════════
#  LOOP PRINCIPAL
# ═══════════════════════════════════════════════════════════
while True:
    ret, frame = cap.read()
    if not ret:
        print("📷 Reconectando...", flush=True)
        cap.release()
        time.sleep(2)
        cap = abrir_camara(CAMARA_URL)
        continue

    frame        = cv2.resize(frame, (640, 480))
    alto, ancho  = frame.shape[:2]
    frame_count += 1
    semaforo_rojo = semaforo_manual

    # ── YOLO cada 6 frames ──────────────────────────────────
    if frame_count % 6 == 0:
        yolo_results = yolo_model(frame, verbose=False, imgsz=320, conf=0.25)

    # ── Líneas de medición ──────────────────────────────────
    cv2.line(frame, (0, LINEA_1_Y), (ancho, LINEA_1_Y), (0, 255, 255), 2)
    cv2.putText(frame, "LINEA 1", (10, LINEA_1_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    cv2.line(frame, (0, LINEA_2_Y), (ancho, LINEA_2_Y), (255, 0, 255), 2)
    cv2.putText(frame, "LINEA 2", (10, LINEA_2_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1)

    # ── Procesar detecciones YOLO ────────────────────────────
    if yolo_results is not None:
        for box in yolo_results[0].boxes:
            cls = int(box.cls[0])
            if cls not in [2, 3, 5, 7]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx   = (x1 + x2) // 2
            cy   = (y1 + y2) // 2
            conf = float(box.conf[0])

            # ID más estable
            auto_id = f"{cx // 120}_{cls}"

            # ── Registrar nuevo auto ──────────────────────────
            if auto_id not in autos_rastreados:
                roi_color = frame[y1:y2, x1:x2]
                color_det = detectar_color_roi(roi_color)
                autos_rastreados[auto_id] = {
                    't1':          time.time(),
                    'cruzó':       False,
                    'velocidad':   0.0,
                    'placa':       None,
                    'color':       color_det,
                    'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                    'ultimo_envio': 0,
                }
            else:
                datos = autos_rastreados[auto_id]
                datos['x1'], datos['y1'] = x1, y1
                datos['x2'], datos['y2'] = x2, y2

                # Actualizar color cada 20 frames
                if frame_count % 20 == 0:
                    roi_color      = frame[y1:y2, x1:x2]
                    datos['color'] = detectar_color_roi(roi_color)

                # OCR cada 25 frames si no tenemos placa
                if not datos['placa'] and frame_count % 25 == 0:
                    placa_y1  = max(0, y2 - int((y2 - y1) * 0.30))
                    placa_roi = frame[placa_y1:y2, x1:x2].copy()
                    leer_placa_async(placa_roi, auto_id, autos_rastreados)

                # ── Cruzó LINEA 1 → foto + Gemini escanea datos
                if cy > LINEA_1_Y and not datos.get('foto_tomada'):
                    datos['foto_tomada'] = True
                    datos['t1']          = time.time()
                    _f  = frame.copy()
                    _x1, _y1, _x2, _y2 = x1, y1, x2, y2
                    _placa   = datos['placa']
                    placa_tmp = _placa or f"TMP-{int(time.time()) % 9999:04d}"
                    foto_anticipada = guardar_foto(_f, placa_tmp, _x1, _y1, _x2, _y2)
                    datos['foto_anticipada'] = foto_anticipada
                    datos['gemini_listo']    = False
                    datos['gemini_datos']    = None
                    print(f"📸 Foto tomada en LINEA 1, escaneando con Gemini...", flush=True)

                    # Gemini escanea en paralelo y guarda resultado
                    # Gemini escanea en paralelo y guarda resultado
                    def on_gemini_l1(modelo, anio, color_g, placa_g, _d=datos):
                        _d['gemini_datos'] = {
                            'modelo': modelo,
                            'anio':   anio,
                            'color':  color_g,
                            'placa':  placa_g,
                        }
                        _d['gemini_listo'] = True
                        print(f"✅ Gemini listo: {modelo} | {placa_g}", flush=True)

                    analizar_foto_gemini(foto_anticipada, _placa, on_gemini_l1)

                    # Si semáforo rojo → multa inmediata en LINEA 1
                    if semaforo_rojo:
                        ahora       = time.time()
                        cooldown_ok = (ahora - datos['ultimo_envio']) > COOLDOWN_SEG
                        if cooldown_ok:
                            with multas_lock:
                                if auto_id not in multas_enviadas:
                                    multas_enviadas.add(auto_id)
                                    datos['ultimo_envio'] = ahora
                                    datos['multa_enviada_l1'] = True

                                    def enviar_cuando_gemini_listo(d, foto, placa_ocr, color_hsv, roj):
                                        # Esperar hasta 8 segundos a que Gemini responda
                                        for _ in range(80):
                                            if d.get('gemini_listo'):
                                                break
                                            time.sleep(0.1)
                                        g = d.get('gemini_datos') or {}
                                        placa_final = placa_ocr or g.get('placa') or "No identificada"
                                        placa_final = re.sub(r'[^A-Z0-9\-]', '', placa_final.upper()) if placa_final else "No identificada"
                                        color_final = color_hsv if color_hsv and color_hsv != "No identificado" else g.get('color', 'No identificado')
                                        enviar_infraccion(
                                            placa_final, 0, roj,
                                            g.get('modelo', 'No identificado'),
                                            g.get('anio',   'No identificado'),
                                            color_final, foto
                                        )

                                    threading.Thread(
    target=enviar_cuando_gemini_listo,
    args=(datos.copy() if False else datos, foto_anticipada, _placa, datos['color'], True),
    daemon=True
).start()

                # ── Cruzó LINEA 2 → calcular velocidad, multa si verde y rápido
                if cy > LINEA_2_Y and not datos['cruzó']:
                    datos['cruzó'] = True
                    dt  = time.time() - datos.get('t1', time.time())
                    vel = min(round((DISTANCIA_METROS / dt) * 3.6, 1), 250.0) if dt > 0.05 else 0
                    datos['velocidad'] = vel
                    print(f"⚡ Velocidad: {vel} km/h", flush=True)

                    # Solo multa por velocidad si semáforo VERDE y va rápido
                    if not semaforo_rojo and vel > VELOCIDAD_LIMITE:
                        ahora       = time.time()
                        cooldown_ok = (ahora - datos['ultimo_envio']) > COOLDOWN_SEG
                        if cooldown_ok:
                            with multas_lock:
                                if auto_id not in multas_enviadas:
                                    multas_enviadas.add(auto_id)
                                    datos['ultimo_envio'] = ahora

                                    def enviar_velocidad(d, foto, placa_ocr, color_hsv, velocidad):
                                        for _ in range(80):
                                            if d.get('gemini_listo'):
                                                break
                                            time.sleep(0.1)
                                        g = d.get('gemini_datos') or {}
                                        placa_final = placa_ocr or g.get('placa') or "No identificada"
                                        placa_final = re.sub(r'[^A-Z0-9\-]', '', placa_final.upper()) if placa_final else "No identificada"
                                        color_final = color_hsv if color_hsv and color_hsv != "No identificado" else g.get('color', 'No identificado')
                                        enviar_infraccion(
                                            placa_final, velocidad, False,
                                            g.get('modelo', 'No identificado'),
                                            g.get('anio',   'No identificado'),
                                            color_final, foto
                                        )

                                    threading.Thread(
                                        target=enviar_velocidad,
                                        args=(datos, datos.get('foto_anticipada'), datos['placa'], datos['color'], vel),
                                        daemon=True
                                    ).start()

            # ── Dibujar bounding box ──────────────────────────
            datos     = autos_rastreados.get(auto_id, {})
            vel_g     = datos.get('velocidad', 0)
            placa_g   = datos.get('placa', None)
            color_g   = datos.get('color', '')
            color_box = (0, 0, 255) if vel_g > VELOCIDAD_LIMITE else (0, 255, 0)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color_box, 2)
            cv2.putText(frame, f"AUTO {conf:.0%}",
                        (x1, y1 - 28), cv2.FONT_HERSHEY_SIMPLEX, 0.42, color_box, 1)

            label2 = placa_g if placa_g else (f"{vel_g} km/h" if vel_g > 0 else "")
            if label2:
                cv2.putText(frame, label2,
                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 215, 255), 2)

            if color_g and color_g != "No identificado":
                cv2.putText(frame, color_g,
                            (x1, y2 + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 0), 1)

            cv2.circle(frame, (cx, cy), 4, color_box, -1)

    # ── Panel superior ───────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (ancho, 58), (20, 15, 10), -1)
    cv2.rectangle(frame, (0, 56), (ancho, 58), (0, 215, 255), -1)
    cv2.putText(frame, "SISTEMA CONTROL DE TRANSITO", (15, 24),
                cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 215, 255), 1)

    est_sem = "ROJO - MULTA" if semaforo_rojo else "VERDE - OK"
    col_txt = (0, 60, 255) if semaforo_rojo else (0, 220, 0)
    cv2.putText(frame,
                f"Multas: {multas_count}   Semaforo: {est_sem}   [R]=cambiar  [Q]=salir",
                (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.38, col_txt, 1)

    # ── Semáforo visual ──────────────────────────────────────
    sx, sy = ancho - 70, 90
    cv2.circle(frame, (sx, sy), 22,
               (0, 0, 220) if semaforo_rojo else (0, 220, 0), -1)
    cv2.circle(frame, (sx, sy), 24, (0, 215, 255), 2)
    cv2.putText(frame, "SEM", (sx - 18, sy + 38),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

    # ── Banner rojo ──────────────────────────────────────────
    if semaforo_rojo:
        overlay = frame.copy()
        cv2.rectangle(overlay,
                      (ancho//2 - 215, alto - 85),
                      (ancho//2 + 215, alto - 45),
                      (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, "!  SEMAFORO EN ROJO - MULTA ACTIVA  !",
                    (ancho//2 - 200, alto - 57),
                    cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1)

    cv2.imshow("Sistema Control de Transito", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('r'):
        semaforo_manual = not semaforo_manual
        print(f"🚦 Semáforo: {'ROJO' if semaforo_manual else 'VERDE'}", flush=True)
    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Sistema detenido.", flush=True)

if len(sys.argv) > 1:
    print(json.dumps({"multas": multas_count, "status": "stopped"}), flush=True)