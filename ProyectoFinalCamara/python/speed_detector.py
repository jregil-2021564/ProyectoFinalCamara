import cv2
import numpy as np
import easyocr
import json
import sys
import time
import re
import os
import threading
from dotenv import dotenv_values

# ─────────────────────────────────────────────────────────────────────────────
#  CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
config   = dotenv_values(env_path)

DROIDCAM_IP   = config.get('DROIDCAM_IP',   '192.168.1.15')
DROIDCAM_PORT = config.get('DROIDCAM_PORT', '4747')
DROIDCAM_URL  = f"http://192.168.1.15:4747/video"

MAX_SPEED_KMH    = 80
PIXEL_TO_METER   = 0.05
VEHICLE_MIN_AREA = 1500

RED_LOWER  = np.array([0,   120,  70])
RED_UPPER  = np.array([10,  255, 255])
RED_LOWER2 = np.array([170, 120,  70])
RED_UPPER2 = np.array([180, 255, 255])

# ─────────────────────────────────────────────────────────────────────────────
#  ESTADO GLOBAL (compartido entre hilo principal y hilo OCR)
# ─────────────────────────────────────────────────────────────────────────────
running        = True
violations     = []
current_speed  = 0.0
max_speed      = 0.0
ran_red        = False
placa_ocr      = None
fine_logged    = set()
speed_history  = []

# Control del hilo OCR
ocr_lock        = threading.Lock()
ocr_frame_queue = None   # último frame pendiente de procesar
ocr_busy        = False  # True mientras OCR está procesando


# ─────────────────────────────────────────────────────────────────────────────
#  HILO OCR — corre en paralelo sin bloquear el video
# ─────────────────────────────────────────────────────────────────────────────
def ocr_worker(reader):
    global ocr_frame_queue, ocr_busy, placa_ocr

    while running:
        # Esperar a que haya un frame para procesar
        with ocr_lock:
            frame_to_process = ocr_frame_queue
            ocr_frame_queue  = None

        if frame_to_process is None:
            time.sleep(0.05)
            continue

        ocr_busy = True
        try:
            h, w = frame_to_process.shape[:2]
            # Zona central inferior donde está la placa
            zona_x1 = w // 4
            zona_y1 = h * 3 // 5
            zona_x2 = w * 3 // 4
            zona_y2 = h * 4 // 5
            roi = frame_to_process[zona_y1:zona_y2, zona_x1:zona_x2]

            if roi.size == 0:
                continue

            texto, confianza = procesar_placa_ocr(roi, reader)
            if texto and confianza > 0.35:
                placa_ocr = texto
                print(f"[OCR] {texto} ({confianza:.0%})", file=sys.stderr, flush=True)

        except Exception as e:
            print(f"[OCR ERROR] {e}", file=sys.stderr)
        finally:
            ocr_busy = False


# ─────────────────────────────────────────────────────────────────────────────
#  VELOCIDAD
# ─────────────────────────────────────────────────────────────────────────────
def calculate_speed(pos1, pos2, elapsed):
    if elapsed <= 0:
        return 0.0
    dist   = np.sqrt((pos2[0] - pos1[0])**2 + (pos2[1] - pos1[1])**2)
    meters = dist * PIXEL_TO_METER
    return (meters / elapsed) * 3.6


def smooth_speed(new_speed, history, window=6):
    history.append(new_speed)
    if len(history) > window:
        history.pop(0)
    return sum(history) / len(history)


# ─────────────────────────────────────────────────────────────────────────────
#  SEMÁFORO ROJO
# ─────────────────────────────────────────────────────────────────────────────
def detect_red_light(frame):
    h = frame.shape[0]
    roi   = frame[:h // 3, :]
    hsv   = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask1 = cv2.inRange(hsv, RED_LOWER,  RED_UPPER)
    mask2 = cv2.inRange(hsv, RED_LOWER2, RED_UPPER2)
    return cv2.countNonZero(cv2.bitwise_or(mask1, mask2)) > 500


# ─────────────────────────────────────────────────────────────────────────────
#  DETECCIÓN DE VEHÍCULO
# ─────────────────────────────────────────────────────────────────────────────
def detect_vehicle(frame, bg_sub):
    fg = bg_sub.apply(frame)
    _, thresh = cv2.threshold(fg, 50, 255, cv2.THRESH_BINARY)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, k)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN,  k)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best, best_area = None, 0
    for c in contours:
        area = cv2.contourArea(c)
        if area > VEHICLE_MIN_AREA and area > best_area:
            best_area = area
            best      = c
    if best is not None:
        M = cv2.moments(best)
        if M["m00"] != 0:
            return (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"])), best
    return None, None


# ─────────────────────────────────────────────────────────────────────────────
#  OCR
# ─────────────────────────────────────────────────────────────────────────────
def procesar_placa_ocr(roi, reader):
    try:
        h, w = roi.shape[:2]
        if h == 0 or w == 0:
            return None, 0

        # Escalar sin exagerar — x2 es suficiente y mucho más rápido que x4
        roi_big = cv2.resize(roi, (w * 2, h * 2))
        gris    = cv2.cvtColor(roi_big, cv2.COLOR_BGR2GRAY)
        _, bw   = cv2.threshold(gris, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Solo un método para máxima velocidad
        resultados = reader.readtext(
            bw,
            allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
            detail=1,
            paragraph=False,
        )

        mejor_texto, mejor_conf = None, 0
        for (_, texto, confianza) in resultados:
            texto_limpio = re.sub(r'[^A-Z0-9\-]', '', texto.upper())
            if len(texto_limpio) >= 4 and confianza > mejor_conf:
                mejor_texto = texto_limpio
                mejor_conf  = confianza

        return mejor_texto, mejor_conf

    except Exception as e:
        print(f"[OCR ERROR] {e}", file=sys.stderr)
        return None, 0


# ─────────────────────────────────────────────────────────────────────────────
#  HUD — dibujado ligero
# ─────────────────────────────────────────────────────────────────────────────
def draw_overlay(frame, speed, is_red, plate_arg, plate_ocr_val, viols, max_spd):
    h, w = frame.shape[:2]

    # Barra superior oscura
    cv2.rectangle(frame, (0, 0), (w, 90), (0, 0, 0), -1)

    # Velocidad actual
    color_spd = (0, 0, 255) if speed > MAX_SPEED_KMH else (0, 230, 0)
    cv2.putText(frame, f"Vel: {speed:.1f} km/h",
                (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color_spd, 2)
    cv2.putText(frame, f"Max: {max_spd:.1f} km/h",
                (10, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 190, 255), 1)

    # Semáforo
    color_red = (0, 0, 255) if is_red else (160, 160, 160)
    cv2.putText(frame, f"Rojo: {'SI' if is_red else 'NO'}",
                (10, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color_red, 2)

    # Placa buscada y OCR
    cv2.putText(frame, f"Buscando: {plate_arg}",
                (w - 270, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 255, 255), 1)
    ocr_color = (0, 255, 0) if plate_ocr_val == plate_arg else (0, 200, 255)
    cv2.putText(frame, f"OCR: {plate_ocr_val or '---'}",
                (w - 270, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.62, ocr_color, 1)
    cv2.putText(frame, f"Multas: {len(viols)}",
                (w - 270, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 1)

    # Zona de placa
    zx1, zy1 = w // 4,       h * 3 // 5
    zx2, zy2 = w * 3 // 4,   h * 4 // 5
    cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (0, 215, 255), 2)
    cv2.putText(frame, "ZONA PLACA", (zx1, zy1 - 6),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 215, 255), 1)

    # Alerta infracción
    if speed > MAX_SPEED_KMH or is_red:
        cv2.rectangle(frame, (0, h - 44), (w, h), (0, 0, 160), -1)
        cv2.putText(frame, "INFRACCION DETECTADA",
                    (w // 2 - 160, h - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)

    return frame


# ─────────────────────────────────────────────────────────────────────────────
#  LOOP PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def run_camera(plate_arg):
    global running, violations, current_speed, max_speed
    global ran_red, placa_ocr, fine_logged, speed_history
    global ocr_frame_queue

    # Cargar EasyOCR una sola vez
    print("[INFO] Cargando EasyOCR...", file=sys.stderr, flush=True)
    reader = easyocr.Reader(['es', 'en'], gpu=False)
    print("[INFO] EasyOCR listo.", file=sys.stderr, flush=True)

    # Lanzar hilo OCR independiente
    t_ocr = threading.Thread(target=ocr_worker, args=(reader,), daemon=True)
    t_ocr.start()

    print(f"[INFO] Conectando a DroidCam: {DROIDCAM_URL}", file=sys.stderr, flush=True)
    cap = cv2.VideoCapture(DROIDCAM_URL)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)   # buffer mínimo = menos lag

    if not cap.isOpened():
        print(json.dumps({"error": f"No se pudo conectar a DroidCam en {DROIDCAM_URL}"}), flush=True)
        return

    print("[INFO] Cámara conectada. Presiona Q para cerrar.", file=sys.stderr, flush=True)

    bg_sub      = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=50, detectShadows=False)
    prev_pos    = None
    prev_time   = None
    frame_count = 0
    ocr_every   = 40   # enviar frame al OCR cada N frames

    window_name = f"Vigilancia - {plate_arg}"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 860, 540)

    while running:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.02)
            continue

        # Redimensionar a resolución fija — menos píxeles = más FPS
        frame = cv2.resize(frame, (860, 540))
        now   = time.time()
        frame_count += 1

        # ── Semáforo ────────────────────────────────────────────
        is_red = detect_red_light(frame)
        if is_red:
            ran_red = True

        # ── Vehículo y velocidad ────────────────────────────────
        centroid, contour = detect_vehicle(frame, bg_sub)
        if centroid and contour is not None:
            cv2.drawContours(frame, [contour], -1, (0, 255, 255), 1)
            cv2.circle(frame, centroid, 5, (0, 255, 0), -1)

            if prev_pos and prev_time:
                elapsed       = now - prev_time
                raw_spd       = calculate_speed(prev_pos, centroid, elapsed)
                current_speed = smooth_speed(raw_spd, speed_history)
                if current_speed > max_speed:
                    max_speed = current_speed

            prev_pos  = centroid
            prev_time = now

        # ── Enviar frame al hilo OCR (no bloquea) ───────────────
        if frame_count % ocr_every == 0 and not ocr_busy:
            with ocr_lock:
                ocr_frame_queue = frame.copy()

        # ── Registrar infracciones ──────────────────────────────
        if max_speed > MAX_SPEED_KMH and 'speed' not in fine_logged:
            fine_logged.add('speed')
            violations.append({
                "reason": f"Exceso de velocidad: {round(max_speed, 1)} km/h (max {MAX_SPEED_KMH})",
                "amount": 500
            })
            print(f"[MULTA] Velocidad: {round(max_speed,1)} km/h", file=sys.stderr, flush=True)

        if ran_red and 'red' not in fine_logged:
            fine_logged.add('red')
            violations.append({
                "reason": "Paso semaforo en rojo",
                "amount": 300
            })
            print("[MULTA] Semaforo en rojo", file=sys.stderr, flush=True)

        # ── HUD y mostrar ───────────────────────────────────────
        frame = draw_overlay(frame, current_speed, is_red,
                             plate_arg, placa_ocr, violations, max_speed)
        cv2.imshow(window_name, frame)

        # waitKey(1) para máxima fluidez
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            running = False
            break

    running = False
    cap.release()
    cv2.destroyAllWindows()

    result = {
        "plate":      plate_arg,
        "plate_ocr":  placa_ocr,
        "max_speed":  round(max_speed, 1),
        "ran_red":    ran_red,
        "violations": violations,
        "captured":   True,
        "match":      placa_ocr == plate_arg if placa_ocr else False,
    }
    print(json.dumps(result), flush=True)


# ─────────────────────────────────────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    plate = sys.argv[1] if len(sys.argv) > 1 else "UNKNOWN"
    run_camera(plate)