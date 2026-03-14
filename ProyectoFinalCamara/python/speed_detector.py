import cv2
import numpy as np
import time
import requests
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
CAMARA_URL       = os.getenv("DROIDCAM_URL", "http://10.151.233.201:4747/video")
LINEA_1_Y        = 180   # Carro debe CRUZAR esta línea con semáforo rojo → multa
LINEA_2_Y        = 320   # Segunda línea para calcular velocidad
DISTANCIA_METROS = 5.0
VELOCIDAD_LIMITE = 60
API_URL          = "http://localhost:3005/api/v1/trafico/infracciones"
COOLDOWN_SEG     = 10
CARPETA_FOTOS    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fotos_infracciones")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")

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
#  INICIALIZAR YOLO
# ═══════════════════════════════════════════════════════════
print("Cargando YOLO...", flush=True)
yolo_model = YOLO('yolov8n.pt')
print("✅ YOLO listo", flush=True)

# ═══════════════════════════════════════════════════════════
#  INICIALIZAR GEMINI
# ═══════════════════════════════════════════════════════════
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY no encontrada en .env", flush=True)
    sys.exit(1)

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
print("✅ Gemini configurado", flush=True)
os.makedirs(CARPETA_FOTOS, exist_ok=True)

# ═══════════════════════════════════════════════════════════
#  GUARDAR FOTO
# ═══════════════════════════════════════════════════════════
def guardar_foto(frame, x1, y1, x2, y2):
    ts     = time.strftime("%Y%m%d_%H%M%S")
    nombre = os.path.join(CARPETA_FOTOS, f"INFRACCION_{ts}.jpg")
    foto   = frame.copy()
    cv2.rectangle(foto, (x1, y1), (x2, y2), (0, 0, 255), 3)
    cv2.putText(foto, time.strftime("%d/%m/%Y %H:%M:%S"),
                (10, foto.shape[0] - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 2)
    cv2.imwrite(nombre, foto, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"📸 Foto guardada: {nombre}", flush=True)
    return nombre

# ═══════════════════════════════════════════════════════════
#  GEMINI — síncrono, igual que test_placa.py
# ═══════════════════════════════════════════════════════════
def analizar_con_gemini(foto_path):
    print(f"📸 Analizando imagen con Gemini...", flush=True)

    with open(foto_path, "rb") as f:
        img_bytes = f.read()

    prompt = (
        "Eres un experto en identificación de vehículos de Guatemala. "
        "Analiza esta foto de una infracción de tráfico con mucho detalle. "
        "Enfócate especialmente en la placa FRONTAL del vehículo. "
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
        model="models/gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            prompt,
        ]
    )

    texto = response.text.strip()
    print(f"\n{'='*50}", flush=True)
    print("🤖 GEMINI:", flush=True)
    print(texto, flush=True)
    print('='*50 + '\n', flush=True)

    modelo = anio = color = placa = None
    for linea in texto.split('\n'):
        l = linea.strip()
        if l.startswith('MODELO:'):
            modelo = l.replace('MODELO:', '').strip()
        elif l.startswith('AÑO:'):
            anio   = l.replace('AÑO:', '').strip()
        elif l.startswith('COLOR:'):
            color  = l.replace('COLOR:', '').strip()
        elif l.startswith('PLACA:'):
            placa  = l.replace('PLACA:', '').strip()
            if placa and placa.lower() in ['no visible', 'no identificado', 'no identificada']:
                placa = None

    if placa:
        placa = re.sub(r'[^A-Z0-9\-]', '', placa.upper()) or None

    return (
        modelo or "No identificado",
        anio   or "No identificado",
        color  or "No identificado",
        placa  or "No identificada",
    )

# ═══════════════════════════════════════════════════════════
#  ENVIAR MULTA
# ═══════════════════════════════════════════════════════════
multas_count = 0

def enviar_multa(placa, velocidad, paso_rojo, modelo, anio, color, foto_path):
    global multas_count
    try:
        payload = {
            "placa":     placa,
            "velocidad": round(float(velocidad), 2),
            "paso_rojo": paso_rojo,
            "modelo_ia": modelo,
            "anio_ia":   anio,
            "color_ia":  color,
            "foto":      foto_path or "",
        }
        resp = requests.post(API_URL, json=payload, timeout=30)
        if resp.status_code == 201:
            multas_count += 1
            reporte = resp.json().get("reporte", {})
            print(f"\n{'='*55}", flush=True)
            print(f"  🚨  MULTA #{multas_count} REGISTRADA EN DB", flush=True)
            print(f"{'='*55}", flush=True)
            print(f"  Placa      : {reporte.get('placa',           'N/A')}", flush=True)
            print(f"  Modelo     : {reporte.get('modelo',          'N/A')}", flush=True)
            print(f"  Año        : {reporte.get('anio',            'N/A')}", flush=True)
            print(f"  Color      : {reporte.get('color',           'N/A')}", flush=True)
            print(f"  Infracción : {reporte.get('tipo_infraccion', 'N/A')}", flush=True)
            print(f"  Monto      : {reporte.get('monto_multa',     'Q0')}", flush=True)
            print(f"{'='*55}\n", flush=True)
        else:
            print(f"❌ Error servidor: {resp.status_code} — {resp.text[:120]}", flush=True)
    except requests.exceptions.ConnectionError:
        print("❌ Node.js no está corriendo en puerto 3005", flush=True)
    except Exception as e:
        print(f"❌ Error enviando multa: {e}", flush=True)

# ═══════════════════════════════════════════════════════════
#  PROCESAR INFRACCIÓN — foto → Gemini → DB
# ═══════════════════════════════════════════════════════════
def procesar_infraccion(frame_copia, x1, y1, x2, y2,
                        color_hsv, velocidad, paso_rojo):
    def _run():
        try:
            foto_path = guardar_foto(frame_copia, x1, y1, x2, y2)
            modelo, anio, color_g, placa = analizar_con_gemini(foto_path)

            color_final = color_hsv if color_hsv and color_hsv != "No identificado" else color_g

            if placa and placa != "No identificada":
                nuevo = foto_path.replace("INFRACCION_", f"{placa}_")
                try:
                    os.rename(foto_path, nuevo)
                    foto_path_final = nuevo
                except Exception:
                    foto_path_final = foto_path
            else:
                foto_path_final = foto_path

            enviar_multa(placa, velocidad, paso_rojo,
                         modelo, anio, color_final, foto_path_final)
        except Exception as e:
            print(f"❌ Error procesando infracción: {e}", flush=True)

    threading.Thread(target=_run, daemon=True).start()

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
print(f"⚠️  Solo multa si el carro CRUZA L1 con semáforo rojo", flush=True)

# ═══════════════════════════════════════════════════════════
#  VARIABLES
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

    # YOLO cada 6 frames
    if frame_count % 6 == 0:
        yolo_results = yolo_model(frame, verbose=False, imgsz=320, conf=0.25)

    # Dibujar líneas
    color_l1 = (0, 0, 255) if semaforo_rojo else (0, 255, 255)
    cv2.line(frame, (0, LINEA_1_Y), (ancho, LINEA_1_Y), color_l1, 2)
    cv2.putText(frame, "L1 — cruzar aqui = MULTA" if semaforo_rojo else "L1",
                (10, LINEA_1_Y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color_l1, 1)

    cv2.line(frame, (0, LINEA_2_Y), (ancho, LINEA_2_Y), (255, 0, 255), 2)
    cv2.putText(frame, "L2-velocidad", (10, LINEA_2_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 0, 255), 1)

    if yolo_results is not None:
        for box in yolo_results[0].boxes:
            cls = int(box.cls[0])
            if cls not in [2, 3, 5, 7]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx   = (x1 + x2) // 2
            cy   = (y1 + y2) // 2
            conf = float(box.conf[0])
            auto_id = f"{cx // 120}_{cls}"

            if auto_id not in autos_rastreados:
                color_det = detectar_color_roi(frame[y1:y2, x1:x2])
                autos_rastreados[auto_id] = {
                    't1':           time.time(),
                    # cy_anterior: para saber de dónde venía el carro
                    'cy_anterior':  cy,
                    'cruzó_l1':     cy > LINEA_1_Y,  # si ya estaba debajo no cuenta
                    'cruzó_l2':     False,
                    'velocidad':    0.0,
                    'color':        color_det,
                    'ultimo_envio': 0,
                    'procesado':    False,
                }
            else:
                datos = autos_rastreados[auto_id]
                cy_prev = datos['cy_anterior']
                datos['cy_anterior'] = cy

                if frame_count % 20 == 0:
                    datos['color'] = detectar_color_roi(frame[y1:y2, x1:x2])

                # ── CRUZÓ L1: venía de arriba (cy_prev < LINEA_1_Y) y ahora está abajo ──
                # Esto garantiza que el carro se MOVIÓ y cruzó la línea
                # No se activa si el carro ya estaba parado debajo de L1
                cruzo_l1_ahora = (cy_prev < LINEA_1_Y) and (cy >= LINEA_1_Y)

                if cruzo_l1_ahora and not datos['cruzó_l1']:
                    datos['cruzó_l1'] = True
                    datos['t1']       = time.time()
                    print(f"🚗 Carro cruzó L1 — semáforo {'ROJO ⛔' if semaforo_rojo else 'VERDE ✅'}", flush=True)

                    # Solo multar si el semáforo está ROJO cuando cruza
                    if semaforo_rojo:
                        ahora = time.time()
                        if (ahora - datos['ultimo_envio']) > COOLDOWN_SEG:
                            with multas_lock:
                                if auto_id not in multas_enviadas:
                                    multas_enviadas.add(auto_id)
                                    datos['ultimo_envio'] = ahora
                                    datos['procesado']    = True
                                    print(f"🚨 Cruzó L1 con ROJO — procesando con Gemini...", flush=True)
                                    procesar_infraccion(
                                        frame.copy(), x1, y1, x2, y2,
                                        datos['color'], 0, True
                                    )

                # ── CRUZÓ L2: calcular velocidad ──────────────────
                if cy > LINEA_2_Y and not datos['cruzó_l2']:
                    datos['cruzó_l2'] = True
                    dt  = time.time() - datos['t1']
                    vel = min(round((DISTANCIA_METROS / dt) * 3.6, 1), 250.0) if dt > 0.05 else 0
                    datos['velocidad'] = vel
                    print(f"⚡ Velocidad: {vel} km/h", flush=True)

                    if not semaforo_rojo and vel > VELOCIDAD_LIMITE and not datos['procesado']:
                        ahora = time.time()
                        if (ahora - datos['ultimo_envio']) > COOLDOWN_SEG:
                            with multas_lock:
                                if auto_id not in multas_enviadas:
                                    multas_enviadas.add(auto_id)
                                    datos['ultimo_envio'] = ahora
                                    datos['procesado']    = True
                                    print(f"🚨 Exceso {vel} km/h — procesando con Gemini...", flush=True)
                                    procesar_infraccion(
                                        frame.copy(), x1, y1, x2, y2,
                                        datos['color'], vel, False
                                    )

            # Dibujar bounding box
            datos     = autos_rastreados.get(auto_id, {})
            vel_g     = datos.get('velocidad', 0)
            color_g   = datos.get('color', '')
            procesado = datos.get('procesado', False)

            if procesado:
                color_box = (0, 165, 255)   # naranja = ya procesado
            elif semaforo_rojo:
                color_box = (0, 0, 255)     # rojo
            else:
                color_box = (0, 255, 0)     # verde

            cv2.rectangle(frame, (x1, y1), (x2, y2), color_box, 2)
            cv2.putText(frame, f"AUTO {conf:.0%}" + (" ✓" if procesado else ""),
                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_box, 1)
            if vel_g > 0:
                cv2.putText(frame, f"{vel_g} km/h",
                            (x1, y2 + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 215, 255), 1)
            if color_g and color_g != "No identificado":
                cv2.putText(frame, color_g,
                            (x1, y2 + 32), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 0), 1)
            cv2.circle(frame, (cx, cy), 4, color_box, -1)

    # Panel superior
    cv2.rectangle(frame, (0, 0), (ancho, 58), (20, 15, 10), -1)
    cv2.rectangle(frame, (0, 56), (ancho, 58), (0, 215, 255), -1)
    cv2.putText(frame, "SISTEMA CONTROL DE TRANSITO", (15, 24),
                cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 215, 255), 1)
    est_sem = "ROJO - MULTA" if semaforo_rojo else "VERDE - OK"
    col_txt = (0, 60, 255) if semaforo_rojo else (0, 220, 0)
    cv2.putText(frame,
                f"Multas: {multas_count}   Semaforo: {est_sem}   [R]=cambiar  [Q]=salir",
                (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.38, col_txt, 1)

    sx, sy = ancho - 70, 90
    cv2.circle(frame, (sx, sy), 22,
               (0, 0, 220) if semaforo_rojo else (0, 220, 0), -1)
    cv2.circle(frame, (sx, sy), 24, (0, 215, 255), 2)
    cv2.putText(frame, "SEM", (sx - 18, sy + 38),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

    if semaforo_rojo:
        overlay = frame.copy()
        cv2.rectangle(overlay, (ancho//2 - 215, alto - 85),
                      (ancho//2 + 215, alto - 45), (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, "!  SEMAFORO EN ROJO - MULTA ACTIVA  !",
                    (ancho//2 - 200, alto - 57),
                    cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1)

    cv2.imshow("Sistema Control de Transito", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('r'):
        semaforo_manual = not semaforo_manual
        if semaforo_manual:
            print("🔴 Semáforo ROJO", flush=True)
        else:
            print("🟢 Semáforo VERDE", flush=True)
            multas_enviadas.clear()
            # Resetear cruzó_l1 para que puedan volver a ser detectados
            for d in autos_rastreados.values():
                d['cruzó_l1']  = False
                d['cruzó_l2']  = False
                d['procesado'] = False
    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Sistema detenido.", flush=True)

if len(sys.argv) > 1:
    print(json.dumps({"multas": multas_count, "status": "stopped"}), flush=True)