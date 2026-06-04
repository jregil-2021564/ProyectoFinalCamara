import cv2
import numpy as np
import time
import threading

# ─── CONFIG ───────────────────────────────────────────────
CAMARA_URL   = "http://192.168.1.15:4747/video"
LINEA_1_Y    = 200
LINEA_2_Y    = 300
DISTANCIA_M  = 5
LIMITE_VEL   = 60
# ──────────────────────────────────────────────────────────

# ─── HILO DE CAPTURA ──────────────────────────────────────
latest_frame = None
frame_lock   = threading.Lock()
running      = True

def capture_loop():
    global latest_frame
    cap = cv2.VideoCapture(CAMARA_URL)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FPS, 30)
    print("Cámara abierta:", cap.isOpened())
    while running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)
            continue
        # Resolución pequeña = todo más rápido
        frame = cv2.resize(frame, (480, 320))
        with frame_lock:
            latest_frame = frame
    cap.release()

threading.Thread(target=capture_loop, daemon=True).start()

# ─── DETECTOR CON HOG (sin IA, muy liviano) ───────────────
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# Usamos background subtractor para detectar movimiento (ULTRA rápido)
bg_sub = cv2.createBackgroundSubtractorMOG2(
    history=200, varThreshold=50, detectShadows=False
)

autos_rastreados = {}
multas = 0

# Esperar primer frame
print("Esperando cámara...")
while True:
    with frame_lock:
        if latest_frame is not None:
            break
    time.sleep(0.05)
print("Cámara lista")

prev_time  = time.time()
fps_smooth = 30.0
detect_boxes = []
detect_count = 0

while True:
    with frame_lock:
        frame = latest_frame.copy() if latest_frame is not None else None
    if frame is None:
        continue

    alto, ancho = frame.shape[:2]
    detect_count += 1

    # ── Detección de movimiento (cada frame, es barato) ──
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    fg_mask = bg_sub.apply(gray)

    # Limpiar ruido
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)

    # Encontrar contornos de objetos en movimiento
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    detect_boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 800:   # ignorar ruido pequeño
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        # Filtrar por proporción (autos son más anchos que altos)
        if w < 30 or h < 20:
            continue
        detect_boxes.append((x, y, x + w, y + h))

    # ── Rastreo y velocidad ────────────────────────────────
    for (x1, y1, x2, y2) in detect_boxes:
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        auto_id = f"{cx // 40}"

        if auto_id not in autos_rastreados:
            if LINEA_1_Y - 30 < cy < LINEA_1_Y + 30:
                autos_rastreados[auto_id] = {
                    't1': time.time(), 'cruzó': False, 'velocidad': 0
                }
        else:
            if cy > LINEA_2_Y and not autos_rastreados[auto_id]['cruzó']:
                dt = time.time() - autos_rastreados[auto_id]['t1']
                if 0.1 < dt < 20:
                    vel = round((DISTANCIA_M / dt) * 3.6, 1)
                    autos_rastreados[auto_id]['cruzó']     = True
                    autos_rastreados[auto_id]['velocidad'] = vel
                    print(f"Velocidad: {vel} km/h")
                    if vel > LIMITE_VEL:
                        multas += 1
                        print(f" EXCESO: {vel} km/h")

        vel   = autos_rastreados.get(auto_id, {}).get('velocidad', 0)
        color = (0, 0, 255) if vel > LIMITE_VEL else (0, 200, 0)

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        if vel > 0:
            cv2.putText(frame, f"{vel} km/h", (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        cv2.circle(frame, (cx, cy), 4, color, -1)

    # ── Líneas de medición ────────────────────────────────
    cv2.line(frame, (0, LINEA_1_Y), (ancho, LINEA_1_Y), (0, 255, 255), 2)
    cv2.putText(frame, "LINEA 1", (10, LINEA_1_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    cv2.line(frame, (0, LINEA_2_Y), (ancho, LINEA_2_Y), (255, 0, 255), 2)
    cv2.putText(frame, "LINEA 2", (10, LINEA_2_Y - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1)

    # ── FPS ───────────────────────────────────────────────
    now = time.time()
    dt  = max(now - prev_time, 1e-9)
    fps_smooth = 0.85 * fps_smooth + 0.15 * (1.0 / dt)
    prev_time  = now

    # ── Panel ─────────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (ancho, 48), (20, 18, 15), -1)
    cv2.putText(frame, "DETECTOR DE VELOCIDAD", (10, 18),
                cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 215, 255), 1)
    cv2.putText(frame, f"Multas: {multas}   FPS: {fps_smooth:.0f}", (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (170, 170, 170), 1)

    cv2.imshow("Detector de Velocidad", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

running = False
cv2.destroyAllWindows()