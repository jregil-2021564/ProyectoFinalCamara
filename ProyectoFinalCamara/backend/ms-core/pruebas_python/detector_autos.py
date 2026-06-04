import cv2
import numpy as np
import time
import requests
import easyocr
import re
import os
import threading
from ultralytics import YOLO
from dotenv import load_dotenv
from google import genai
from google.genai import types
 
load_dotenv()
 
# ── Inicializar modelos ──────────────────────────────────────
print("Cargando modelo YOLO...")
model = YOLO('yolov8n.pt')
print("YOLO cargado")
 
print("Cargando EasyOCR...")
reader = easyocr.Reader(['es', 'en'], gpu=False)
print("EasyOCR cargado")
 
# ── Configurar Gemini ────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAk057tsv03qDWuxcrpvqDSNhfsdl1eogQ")
client = genai.Client(api_key=GEMINI_API_KEY)
print("Gemini configurado")
 
# ── Cámara ───────────────────────────────────────────────────
cap = cv2.VideoCapture("http://192.168.68.102:4747/video")
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
print("Camara abierta:", cap.isOpened())
print("Presiona R para cambiar semáforo ROJO/VERDE")
print("Presiona Q para salir")
 
# ── Configuración ────────────────────────────────────────────
LINEA_1_Y        = 150
LINEA_2_Y        = 280
DISTANCIA_METROS = 5
VELOCIDAD_LIMITE = 60
API_URL          = "http://localhost:3005/api/v1/trafico/infracciones"
COOLDOWN_SEG     = 3
 
# ── Carpeta de fotos ─────────────────────────────────────────
CARPETA_FOTOS = "fotos_infracciones"
os.makedirs(CARPETA_FOTOS, exist_ok=True)
print(f"Fotos se guardarán en: {os.path.abspath(CARPETA_FOTOS)}")
 
# ── Variables globales ───────────────────────────────────────
autos_rastreados = {}
multas_enviadas  = set()
multas_count     = 0
frame_count      = 0
results          = None
ultimo_envio     = 0
semaforo_manual  = False
ocr_corriendo    = False
 
# ── Analizar carro con Gemini IA ─────────────────────────────
def analizar_con_gemini(frame, x1, y1, x2, y2, callback):
    def _analizar():
        try:
            margen = 30
            x1m = max(0, x1 - margen)
            y1m = max(0, y1 - margen)
            x2m = min(frame.shape[1], x2 + margen)
            y2m = min(frame.shape[0], y2 + margen)
            roi = frame[y1m:y2m, x1m:x2m]
 
            if roi.size == 0:
                callback(None, None, None, None)
                return
 
            _, buffer = cv2.imencode('.jpg', roi, [cv2.IMWRITE_JPEG_QUALITY, 90])
            img_bytes = buffer.tobytes()
 
            prompt = (
                "Analiza este vehículo y responde SOLO en este formato exacto, sin explicaciones:\n"
                "MODELO: [marca y modelo del vehículo]\n"
                "COLOR: [color principal del vehículo]\n"
                "AÑO: [año aproximado o rango de años]\n"
                "PLACA: [número de placa si se puede leer, si no escribe No visible]\n"
                "Si no puedes identificar algún campo escribe 'No identificado'."
            )
 
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )
 
            texto = response.text
            print(f"Gemini IA:\n{texto.strip()}")
 
            modelo = color = anio = placa_ia = None
            for linea in texto.split('\n'):
                linea = linea.strip()
                if linea.startswith('MODELO:'):
                    modelo   = linea.replace('MODELO:', '').strip()
                elif linea.startswith('COLOR:'):
                    color    = linea.replace('COLOR:', '').strip()
                elif linea.startswith('AÑO:'):
                    anio     = linea.replace('AÑO:', '').strip()
                elif linea.startswith('PLACA:'):
                    placa_ia = linea.replace('PLACA:', '').strip()
 
            callback(modelo, color, anio, placa_ia)
 
        except Exception as e:
            print(f"Error Gemini: {e}")
            callback(None, None, None, None)
 
    threading.Thread(target=_analizar, daemon=True).start()
 
# ── OCR en hilo separado ─────────────────────────────────────
def leer_placa(frame, x1, y1, x2, y2, auto_id):
    global ocr_corriendo
    if ocr_corriendo:
        return
 
    def _ocr():
        global ocr_corriendo
        ocr_corriendo = True
        try:
            h = y2 - y1
            w = x2 - x1
            if h <= 0 or w <= 0:
                return
 
            roi = frame[y2 - int(h * 0.25):y2, x1:x2]
            if roi.size == 0:
                return
 
            roi_big = cv2.resize(roi, (w * 4, max(1, int(h * 0.25) * 4)))
            gris    = cv2.cvtColor(roi_big, cv2.COLOR_BGR2GRAY)
            blur    = cv2.GaussianBlur(gris, (3, 3), 0)
            _, bw   = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
 
            for img_ocr in [bw, cv2.bitwise_not(bw)]:
                resultados = reader.readtext(
                    img_ocr,
                    allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                    detail=1,
                    paragraph=False,
                    width_ths=0.7,
                )
                for (_, texto, confianza) in resultados:
                    texto_limpio = re.sub(r'[^A-Z0-9\-]', '', texto.upper())
                    es_placa = (
                        re.match(r'^[A-Z]-\d{3}[A-Z]{2,3}$', texto_limpio) or
                        re.match(r'^\d{3}-[A-Z]{3}$', texto_limpio)         or
                        re.match(r'^[A-Z]{3}-\d{3}$', texto_limpio)         or
                        (len(texto_limpio) >= 5 and confianza > 0.5)
                    )
                    if es_placa:
                        if auto_id in autos_rastreados:
                            autos_rastreados[auto_id]['placa'] = texto_limpio
                            print(f"Placa OCR: {texto_limpio} (confianza: {confianza:.0%})")
                        return
        except Exception as e:
            print(f"Error OCR: {e}")
        finally:
            ocr_corriendo = False
 
    threading.Thread(target=_ocr, daemon=True).start()
 
# ── Guardar foto ─────────────────────────────────────────────
def guardar_foto(frame, placa, x1, y1, x2, y2):
    try:
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        nombre    = f"{CARPETA_FOTOS}/{placa}_{timestamp}.jpg"
        foto      = frame.copy()
        cv2.rectangle(foto, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(foto, f"INFRACTOR: {placa}", (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(foto, time.strftime("%d/%m/%Y %H:%M:%S"),
                    (10, foto.shape[0] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 2)
        cv2.imwrite(nombre, foto)
        print(f"📸 Foto guardada: {nombre}")
        return nombre
    except Exception as e:
        print(f"Error guardando foto: {e}")
        return None
 
# ── Enviar infracción al servidor ────────────────────────────
def enviar_infraccion(placa, velocidad, paso_rojo, modelo_ia, color_ia, anio_ia, foto_path):
    global ultimo_envio, multas_count
 
    ahora = time.time()
    if ahora - ultimo_envio < COOLDOWN_SEG:
        return False
    ultimo_envio = ahora
 
    try:
        payload = {
            "placa":     placa or "NO-DETECTADA",
            "velocidad": round(float(velocidad), 2),
            "paso_rojo": paso_rojo,
            "modelo_ia": modelo_ia or "No identificado",
            "color_ia":  color_ia  or "No identificado",
            "anio_ia":   anio_ia   or "No identificado",
            "foto":      foto_path or "",
        }
        response = requests.post(API_URL, json=payload, timeout=30)
 
        if response.status_code == 201:
            data    = response.json()
            reporte = data.get("reporte", {})
            multas_count += 1
            print(f"\n{'='*55}")
            print(f"   MULTA #{multas_count} REGISTRADA")
            print(f"{'='*55}")
            print(f"  Placa        : {reporte.get('placa',           'N/A')}")
            print(f"  Modelo       : {reporte.get('modelo',          'N/A')}")
            print(f"  Año          : {reporte.get('anio',            'N/A')}")
            print(f"  Color        : {reporte.get('color',           'N/A')}")
            print(f"  Infracción   : {reporte.get('tipo_infraccion', 'N/A')}")
            print(f"  Monto        : {reporte.get('monto_multa',     'Q0')}")
            print(f"  Foto         : {foto_path or 'No guardada'}")
            print(f"  Fecha        : {reporte.get('fecha',           'N/A')}")
            print(f"{'='*55}\n")
            return True
        elif response.status_code == 200:
            return False
        else:
            print(f"Error servidor: {response.status_code}")
            return False
 
    except requests.exceptions.ConnectionError:
        print("Node.js no está corriendo. Inicia con: npm run dev")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False
 
# ── Loop principal ───────────────────────────────────────────
while True:
    ret, frame = cap.read()
    if not ret:
        print("📷 Reconectando cámara...")
        cap.release()
        time.sleep(2)
        cap = cv2.VideoCapture("http://10.175.7.17:4747/video")
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        continue
 
    frame       = cv2.resize(frame, (640, 480))
    alto, ancho = frame.shape[:2]
    frame_count += 1
    semaforo_rojo = semaforo_manual
 
    # YOLO cada 5 frames
    if frame_count % 5 == 0:
        results = model(frame, verbose=False, imgsz=320, conf=0.15)
 
    # ── Líneas ───────────────────────────────────────────────
    cv2.line(frame, (0, LINEA_1_Y), (ancho, LINEA_1_Y), (0, 255, 255), 2)
    cv2.putText(frame, "LINEA 1", (10, LINEA_1_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    cv2.line(frame, (0, LINEA_2_Y), (ancho, LINEA_2_Y), (255, 0, 255), 2)
    cv2.putText(frame, "LINEA 2", (10, LINEA_2_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1)
 
    # ── Detecciones ──────────────────────────────────────────
    if results is not None:
        for box in results[0].boxes:
            cls = int(box.cls[0])
            if cls not in [2, 3, 5, 7]:
                continue
 
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx        = (x1 + x2) // 2
            cy        = (y1 + y2) // 2
            confianza = float(box.conf[0])
            auto_id   = f"{cx // 50}_{cls}"
 
            if auto_id not in autos_rastreados:
                if cy > LINEA_1_Y:
                    autos_rastreados[auto_id] = {
                        't1': time.time(), 'cruzó': False,
                        'velocidad': 0, 'placa': None,
                        'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                    }
            else:
                datos = autos_rastreados[auto_id]
                datos['x1'], datos['y1'] = x1, y1
                datos['x2'], datos['y2'] = x2, y2
 
                if not datos['placa'] and frame_count % 30 == 0:
                    leer_placa(frame.copy(), x1, y1, x2, y2, auto_id)
 
                if cy > LINEA_2_Y and not datos['cruzó']:
                    dt = time.time() - datos['t1']
                    if dt > 0.1:
                        velocidad_calc     = min(round((DISTANCIA_METROS / dt) * 3.6, 1), 200.0)
                        datos['cruzó']     = True
                        datos['velocidad'] = velocidad_calc
 
                        print(f"🚗 Auto | vel: {velocidad_calc} km/h | sem: {'ROJO' if semaforo_rojo else 'VERDE'}")
 
                        hay_infraccion = velocidad_calc > VELOCIDAD_LIMITE or semaforo_rojo
                        if hay_infraccion and auto_id not in multas_enviadas:
                            multas_enviadas.add(auto_id)
                            fs   = frame.copy()
                            _x1, _y1, _x2, _y2 = datos['x1'], datos['y1'], datos['x2'], datos['y2']
                            _vel, _rojo, _pocr   = velocidad_calc, semaforo_rojo, datos['placa']
 
                            def _procesar(f=fs, bx1=_x1, by1=_y1, bx2=_x2, by2=_y2,
                                          v=_vel, r=_rojo, pocr=_pocr):
                                def on_gemini(modelo, color, anio, placa_gemini):
                                    placa_final = pocr or placa_gemini or f"P-{bx1 % 999:03d}GT"
                                    if placa_final:
                                        placa_final = re.sub(r'[^A-Z0-9\-]', '', placa_final.upper())
                                    foto_path = guardar_foto(f, placa_final, bx1, by1, bx2, by2)
                                    enviar_infraccion(placa_final, v, r, modelo, color, anio, foto_path)
                                analizar_con_gemini(f, bx1, by1, bx2, by2, on_gemini)
 
                            threading.Thread(target=_procesar, daemon=True).start()
 
            vel_guardada   = autos_rastreados.get(auto_id, {}).get('velocidad', 0)
            placa_guardada = autos_rastreados.get(auto_id, {}).get('placa', None)
            color_box      = (0, 0, 255) if vel_guardada > VELOCIDAD_LIMITE else (0, 255, 0)
 
            cv2.rectangle(frame, (x1, y1), (x2, y2), color_box, 2)
            cv2.putText(frame, f"AUTO {confianza:.0%}", (x1, y1 - 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color_box, 1)
            if placa_guardada:
                cv2.putText(frame, placa_guardada, (x1, y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 215, 255), 2)
            elif vel_guardada > 0:
                cv2.putText(frame, f"{vel_guardada} km/h", (x1, y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_box, 2)
            cv2.circle(frame, (cx, cy), 4, color_box, -1)
 
    # ── Panel superior ───────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (ancho, 58), (20, 15, 10), -1)
    cv2.rectangle(frame, (0, 56), (ancho, 58), (0, 215, 255), -1)
    cv2.putText(frame, "SISTEMA CONTROL DE TRANSITO", (15, 24),
                cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 215, 255), 1)
 
    estado_sem  = "ROJO - MULTA" if semaforo_rojo else "VERDE - OK"
    color_texto = (0, 0, 255) if semaforo_rojo else (0, 220, 0)
    cv2.putText(frame, f"Multas: {multas_count}   Semaforo: {estado_sem}   [R]=cambiar  [Q]=salir",
                (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.38, color_texto, 1)
 
    sem_x, sem_y = ancho - 70, 90
    cv2.circle(frame, (sem_x, sem_y), 22,
               (0, 0, 220) if semaforo_rojo else (0, 220, 0), -1)
    cv2.circle(frame, (sem_x, sem_y), 24, (0, 215, 255), 2)
    cv2.putText(frame, "SEM", (sem_x - 18, sem_y + 38),
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
        print(f"Semáforo: {'ROJO' if semaforo_manual else 'VERDE'}")
    elif key == ord('q'):
        break
 
cap.release()
cv2.destroyAllWindows()
print("Sistema detenido.")