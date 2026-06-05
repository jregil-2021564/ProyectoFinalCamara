import cv2
import numpy as np
import time
import requests
import re
import os
import sys
import cv2
import numpy as np
import time
import requests
import re
import os
import sys
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from ultralytics import YOLO
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ═══════════════════════════════════════════════════════════
#  CONFIGURACIÓN ORIGINAL (sin cambios)
# ═══════════════════════════════════════════════════════════
LINEA_1_Y        = 180
LINEA_2_Y        = 320
DISTANCIA_METROS = 5.0
VELOCIDAD_LIMITE = 60
API_URL          = "http://localhost:3006/api/v1/trafico/infracciones"
COOLDOWN_SEG     = 10
CARPETA_FOTOS    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fotos_infracciones")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")

# ═══════════════════════════════════════════════════════════
#  NUEVO: CONFIGURACIÓN DE MÚLTIPLES CÁMARAS
#  Agrega/quita URLs en tu .env de ms-core
# ═══════════════════════════════════════════════════════════
CAMARAS_CONFIG = [
    {
        "id":     0,
        "nombre": "Cámara 1 — Principal",
        "url":    os.getenv("CAM_0_URL", os.getenv("DROIDCAM_URL", "http://192.168.1.5:4747/video")),
        "activa": True,
    },
    {
        "id":     1,
        "nombre": "Cámara 2",
        "url":    os.getenv("CAM_1_URL", "http://192.168.1.28:4747/video"),
        "activa": bool(os.getenv("CAM_1_URL")),   # solo activa si existe en .env
    },
    {
        "id":     2,
        "nombre": "Cámara 3",
        "url":    os.getenv("CAM_2_URL", ""),
        "activa": bool(os.getenv("CAM_2_URL")),
    },
    {
        "id":     3,
        "nombre": "Cámara 4",
        "url":    os.getenv("CAM_3_URL", ""),
        "activa": bool(os.getenv("CAM_3_URL")),
    },
]

STREAMING_PORT = int(os.getenv("STREAMING_PORT", "5001"))

# ═══════════════════════════════════════════════════════════
#  ESTADO GLOBAL PARA STREAMING
# ═══════════════════════════════════════════════════════════
latest_frames = {c["id"]: None for c in CAMARAS_CONFIG}
frames_lock   = threading.Lock()
multas_count  = 0
semaforos     = {c["id"]: False for c in CAMARAS_CONFIG}

# ═══════════════════════════════════════════════════════════
#  COLORES HSV (igual que antes)
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
#  INICIALIZAR YOLO (igual que antes)
# ═══════════════════════════════════════════════════════════
print("Cargando YOLO...", flush=True)
yolo_model = YOLO('yolov8n.pt')
print("✅ YOLO listo", flush=True)

# ═══════════════════════════════════════════════════════════
#  INICIALIZAR GEMINI (igual que antes)
# ═══════════════════════════════════════════════════════════
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY no encontrada en .env", flush=True)
    sys.exit(1)

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
print("✅ Gemini configurado", flush=True)
os.makedirs(CARPETA_FOTOS, exist_ok=True)

# ═══════════════════════════════════════════════════════════
#  GUARDAR FOTO (igual que antes + cam_id en nombre)
# ═══════════════════════════════════════════════════════════
def guardar_foto(frame, x1, y1, x2, y2, cam_id=0):
    ts     = time.strftime("%Y%m%d_%H%M%S")
    nombre = os.path.join(CARPETA_FOTOS, f"CAM{cam_id}_INFRACCION_{ts}.jpg")
    foto   = frame.copy()
    cv2.rectangle(foto, (x1, y1), (x2, y2), (0, 0, 255), 3)
    cv2.putText(foto, time.strftime("%d/%m/%Y %H:%M:%S"),
                (10, foto.shape[0] - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 2)
    cv2.imwrite(nombre, foto, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"📸 Foto guardada: {nombre}", flush=True)
    return nombre

# ═══════════════════════════════════════════════════════════
#  GEMINI — exactamente igual que antes
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
#  ENVIAR MULTA (igual que antes)
# ═══════════════════════════════════════════════════════════
def enviar_multa(placa, velocidad, paso_rojo, modelo, anio, color, foto_path, cam_id=0):
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
            print(f"  🚨  MULTA #{multas_count} REGISTRADA — CAM{cam_id}", flush=True)
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
        print("❌ Node.js no está corriendo en puerto 3006", flush=True)
    except Exception as e:
        print(f"❌ Error enviando multa: {e}", flush=True)

# ═══════════════════════════════════════════════════════════
#  PROCESAR INFRACCIÓN (igual que antes + cam_id)
# ═══════════════════════════════════════════════════════════
def procesar_infraccion(frame_copia, x1, y1, x2, y2,
                        color_hsv, velocidad, paso_rojo, cam_id=0):
    def _run():
        try:
            foto_path = guardar_foto(frame_copia, x1, y1, x2, y2, cam_id)
            modelo, anio, color_g, placa = analizar_con_gemini(foto_path)
            color_final = color_hsv if color_hsv and color_hsv != "No identificado" else color_g
            if placa and placa != "No identificada":
                nuevo = foto_path.replace(f"CAM{cam_id}_INFRACCION_", f"CAM{cam_id}_{placa}_")
                try:
                    os.rename(foto_path, nuevo)
                    foto_path = nuevo
                except Exception:
                    pass
            enviar_multa(placa, velocidad, paso_rojo,
                         modelo, anio, color_final, foto_path, cam_id)
        except Exception as e:
            print(f"❌ Error procesando infracción: {e}", flush=True)

    threading.Thread(target=_run, daemon=True).start()

# ═══════════════════════════════════════════════════════════
#  NUEVO: SERVIDOR MJPEG para el frontend web
# ═══════════════════════════════════════════════════════════
class MJPEGHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass  # silencia logs HTTP

    def do_GET(self):
        # GET /cam/0 → stream MJPEG de la cámara 0
        if self.path.startswith('/cam/'):
            try:
                cam_id = int(self.path.split('/')[-1].split('?')[0])
            except:
                self.send_error(400); return

            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                while True:
                    with frames_lock:
                        frame_bytes = latest_frames.get(cam_id)
                    if frame_bytes:
                        self.wfile.write(b'--frame\r\n')
                        self.wfile.write(b'Content-Type: image/jpeg\r\n\r\n')
                        self.wfile.write(frame_bytes)
                        self.wfile.write(b'\r\n')
                    time.sleep(0.05)
            except (BrokenPipeError, ConnectionResetError):
                pass

        # GET /status → JSON con estado de todas las cámaras
        elif self.path.startswith('/status'):
            body = json.dumps({
                "multas_count": multas_count,
                "camaras": [
                    {
                        "id":           c["id"],
                        "nombre":       c["nombre"],
                        "activa":       c["activa"],
                        "semaforo_rojo": semaforos.get(c["id"], False),
                        "tiene_frame":  latest_frames.get(c["id"]) is not None,
                    }
                    for c in CAMARAS_CONFIG
                ]
            }).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Servidor HTTP multi-thread — una conexión por thread"""
    daemon_threads = True
    allow_reuse_address = True

def iniciar_servidor_streaming():
    server = ThreadedHTTPServer(('0.0.0.0', STREAMING_PORT), MJPEGHandler)
    print(f"📡 Streaming web en http://localhost:{STREAMING_PORT}/cam/0", flush=True)
    print(f"📊 Estado:          http://localhost:{STREAMING_PORT}/status", flush=True)
    server.serve_forever()

# Iniciar servidor MJPEG multi-thread
threading.Thread(target=iniciar_servidor_streaming, daemon=True).start()

# ═══════════════════════════════════════════════════════════
#  LOOP POR CÁMARA — cada cámara en su propio thread
#  (lógica original de detección, sin cambios)
# ═══════════════════════════════════════════════════════════
def loop_camara(config):
    cam_id   = config["id"]
    cam_url  = config["url"]

    print(f"📷 Iniciando {config['nombre']} — {cam_url}", flush=True)

    def abrir_camara(url):
        cap = cv2.VideoCapture(url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap

    cap = abrir_camara(cam_url)
    if not cap.isOpened():
        print(f"❌ No se pudo abrir cámara {cam_id}: {cam_url}", flush=True)
        return

    print(f"✅ Cámara {cam_id} abierta", flush=True)

    autos_rastreados = {}
    multas_enviadas  = set()
    multas_lock_cam  = threading.Lock()
    frame_count      = 0
    yolo_results     = None
    # Semáforo manual por cámara — se controla con tecla R en la ventana
    # Para cámara 0 sigue funcionando con ventana OpenCV
    semaforo_manual  = False

    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"📷 CAM{cam_id} reconectando...", flush=True)
            cap.release()
            time.sleep(2)
            cap = abrir_camara(cam_url)
            continue

        frame        = cv2.resize(frame, (640, 480))
        alto, ancho  = frame.shape[:2]
        frame_count += 1
        semaforo_rojo = semaforo_manual
        semaforos[cam_id] = semaforo_rojo  # actualizar estado global

        # YOLO cada 6 frames
        if frame_count % 6 == 0:
            yolo_results = yolo_model(frame, verbose=False, imgsz=320, conf=0.25)

        # Dibujar líneas (igual que antes)
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
                auto_id = f"{cam_id}_{cx // 120}_{cls}"

                if auto_id not in autos_rastreados:
                    color_det = detectar_color_roi(frame[y1:y2, x1:x2])
                    autos_rastreados[auto_id] = {
                        't1':          time.time(),
                        'cy_anterior': cy,
                        'cruzó_l1':    cy > LINEA_1_Y,
                        'cruzó_l2':    False,
                        'velocidad':   0.0,
                        'color':       color_det,
                        'ultimo_envio': 0,
                        'procesado':   False,
                    }
                else:
                    datos   = autos_rastreados[auto_id]
                    cy_prev = datos['cy_anterior']
                    datos['cy_anterior'] = cy

                    if frame_count % 20 == 0:
                        datos['color'] = detectar_color_roi(frame[y1:y2, x1:x2])

                    # Cruzó L1 viniendo de arriba
                    cruzo_l1_ahora = (cy_prev < LINEA_1_Y) and (cy >= LINEA_1_Y)

                    if cruzo_l1_ahora and not datos['cruzó_l1']:
                        datos['cruzó_l1'] = True
                        datos['t1']       = time.time()
                        print(f"🚗 CAM{cam_id} cruzó L1 — semáforo {'ROJO ⛔' if semaforo_rojo else 'VERDE ✅'}", flush=True)

                        if semaforo_rojo:
                            ahora = time.time()
                            if (ahora - datos['ultimo_envio']) > COOLDOWN_SEG:
                                with multas_lock_cam:
                                    if auto_id not in multas_enviadas:
                                        multas_enviadas.add(auto_id)
                                        datos['ultimo_envio'] = ahora
                                        datos['procesado']    = True
                                        print(f"🚨 CAM{cam_id} cruzó L1 con ROJO — procesando...", flush=True)
                                        procesar_infraccion(
                                            frame.copy(), x1, y1, x2, y2,
                                            datos['color'], 0, True, cam_id
                                        )

                    # Cruzó L2 — calcular velocidad
                    if cy > LINEA_2_Y and not datos['cruzó_l2']:
                        datos['cruzó_l2'] = True
                        dt  = time.time() - datos['t1']
                        vel = min(round((DISTANCIA_METROS / dt) * 3.6, 1), 250.0) if dt > 0.05 else 0
                        datos['velocidad'] = vel
                        print(f"⚡ CAM{cam_id} velocidad: {vel} km/h", flush=True)

                        if not semaforo_rojo and vel > VELOCIDAD_LIMITE and not datos['procesado']:
                            ahora = time.time()
                            if (ahora - datos['ultimo_envio']) > COOLDOWN_SEG:
                                with multas_lock_cam:
                                    if auto_id not in multas_enviadas:
                                        multas_enviadas.add(auto_id)
                                        datos['ultimo_envio'] = ahora
                                        datos['procesado']    = True
                                        print(f"🚨 CAM{cam_id} exceso {vel} km/h — procesando...", flush=True)
                                        procesar_infraccion(
                                            frame.copy(), x1, y1, x2, y2,
                                            datos['color'], vel, False, cam_id
                                        )

                # Dibujar bounding box (igual que antes)
                datos     = autos_rastreados.get(auto_id, {})
                vel_g     = datos.get('velocidad', 0)
                color_g   = datos.get('color', '')
                procesado = datos.get('procesado', False)

                if procesado:
                    color_box = (0, 165, 255)
                elif semaforo_rojo:
                    color_box = (0, 0, 255)
                else:
                    color_box = (0, 255, 0)

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

        # Panel superior (igual que antes)
        cv2.rectangle(frame, (0, 0), (ancho, 58), (20, 15, 10), -1)
        cv2.rectangle(frame, (0, 56), (ancho, 58), (0, 215, 255), -1)
        cv2.putText(frame, f"CAM{cam_id} — SISTEMA CONTROL DE TRANSITO", (15, 24),
                    cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 215, 255), 1)
        est_sem = "ROJO - MULTA" if semaforo_rojo else "VERDE - OK"
        col_txt = (0, 60, 255) if semaforo_rojo else (0, 220, 0)
        cv2.putText(frame,
                    f"Multas: {multas_count}   Semaforo: {est_sem}   [R]=cambiar  [Q]=salir",
                    (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.38, col_txt, 1)

        # Círculo semáforo (igual que antes)
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

        # NUEVO: guardar frame para streaming web
        _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        with frames_lock:
            latest_frames[cam_id] = buf.tobytes()

        # Solo cámara 0 abre ventana OpenCV (igual que antes)
        if cam_id == 0:
            cv2.imshow(f"Sistema Control de Transito — CAM{cam_id}", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('r'):
                semaforo_manual = not semaforo_manual
                if semaforo_manual:
                    print(f"🔴 CAM{cam_id} Semáforo ROJO", flush=True)
                else:
                    print(f"🟢 CAM{cam_id} Semáforo VERDE", flush=True)
                    multas_enviadas.clear()
                    for d in autos_rastreados.values():
                        d['cruzó_l1'] = False
                        d['cruzó_l2'] = False
                        d['procesado'] = False
            elif key == ord('q'):
                break
        else:
            # Cámaras 1-3: R y Q por teclado también (ventana separada)
            cv2.imshow(f"CAM{cam_id} — {config['nombre']}", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('r'):
                semaforo_manual = not semaforo_manual
                print(f"{'🔴' if semaforo_manual else '🟢'} CAM{cam_id} Semáforo {'ROJO' if semaforo_manual else 'VERDE'}", flush=True)
                if not semaforo_manual:
                    multas_enviadas.clear()
                    for d in autos_rastreados.values():
                        d['cruzó_l1'] = False
                        d['cruzó_l2'] = False
                        d['procesado'] = False
            elif key == ord('q'):
                break

    cap.release()
    try:
        cv2.destroyWindow(f"CAM{cam_id} — {config['nombre']}")
    except Exception:
        pass

# ═══════════════════════════════════════════════════════════
#  INICIAR THREADS POR CÁMARA
# ═══════════════════════════════════════════════════════════
camaras_activas = [c for c in CAMARAS_CONFIG if c["activa"] and c["url"]]
print(f"\n🚀 Iniciando {len(camaras_activas)} cámara(s)...", flush=True)
print(f"📡 Stream web: http://localhost:{STREAMING_PORT}/cam/0", flush=True)
print(f"📊 Estado:     http://localhost:{STREAMING_PORT}/status\n", flush=True)

threads = []
for cam_config in camaras_activas:
    t = threading.Thread(target=loop_camara, args=(cam_config,), daemon=True)
    t.start()
    threads.append(t)
    time.sleep(0.3)

# Mantener vivo + emitir estado para Node
try:
    while True:
        time.sleep(1)
        print(f"STATUS:{json.dumps({'multas': multas_count, 'camaras': len(camaras_activas)})}", flush=True)
except KeyboardInterrupt:
    pass

cv2.destroyAllWindows()
print("Sistema detenido.", flush=True)
if len(sys.argv) > 1:
    print(json.dumps({"multas": multas_count, "status": "stopped"}), flush=True)