import cv2
import numpy as np
 
print("Iniciando detector de color...")
 
cap = cv2.VideoCapture("http://192.168.1.15:4747/video")
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
print("Camara abierta:", cap.isOpened())
print(" Apunta la cámara al carro")
print(" Presiona Q para salir")
 
# ── Rangos de colores en HSV ─────────────────────────────────
COLORES_HSV = {
    "Rojo":      [([0,   100, 80],  [10,  255, 255]),
                  ([165, 100, 80],  [180, 255, 255])],
    "Naranja":   [([11,  100, 80],  [25,  255, 255])],
    "Amarillo":  [([26,  100, 80],  [34,  255, 255])],
    "Verde":     [([35,  60,  40],  [85,  255, 255])],
    "Azul":      [([86,  60,  40],  [130, 255, 255])],
    "Morado":    [([131, 60,  40],  [164, 255, 255])],
    "Blanco":    [([0,   0,   200], [180, 30,  255])],
    "Gris":      [([0,   0,   80],  [180, 30,  200])],
    "Negro":     [([0,   0,   0],   [180, 255, 50])],
    "Plateado":  [([0,   0,   170], [180, 25,  220])],
}
 
def detectar_color(roi):
    """Detecta el color dominante en el ROI."""
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
 
    conteos = {}
    for nombre, rangos in COLORES_HSV.items():
        mask_total = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for (low, high) in rangos:
            mask = cv2.inRange(hsv, np.array(low), np.array(high))
            mask_total = cv2.bitwise_or(mask_total, mask)
        conteos[nombre] = cv2.countNonZero(mask_total)
 
    # El color con más píxeles gana
    color_dominante = max(conteos, key=conteos.get)
    total_px        = roi.shape[0] * roi.shape[1]
    porcentaje      = (conteos[color_dominante] / total_px) * 100
 
    return color_dominante, porcentaje, conteos
 
# Colores para mostrar en pantalla
COLORES_BGR = {
    "Rojo":     (0,   0,   220),
    "Naranja":  (0,   140, 255),
    "Amarillo": (0,   220, 220),
    "Verde":    (0,   200, 0),
    "Azul":     (220, 100, 0),
    "Morado":   (180, 0,   180),
    "Blanco":   (255, 255, 255),
    "Gris":     (150, 150, 150),
    "Negro":    (80,  80,  80),
    "Plateado": (200, 200, 210),
}
 
color_actual    = "Detectando..."
porcentaje_act  = 0
 
while True:
    ret, frame = cap.read()
    if not ret:
        continue
 
    frame       = cv2.resize(frame, (640, 480))
    alto, ancho = frame.shape[:2]
 
    # ── Zona de análisis (parte del carro, evitar cielo/fondo)
    zona_x1 = ancho // 5
    zona_y1 = alto  // 5
    zona_x2 = ancho * 4 // 5
    zona_y2 = alto  * 3 // 4
 
    roi = frame[zona_y1:zona_y2, zona_x1:zona_x2]
 
    color_actual, porcentaje_act, todos = detectar_color(roi)
 
    # Dibujar zona de análisis
    color_display = COLORES_BGR.get(color_actual, (255, 255, 255))
    cv2.rectangle(frame, (zona_x1, zona_y1), (zona_x2, zona_y2), color_display, 2)
 
    # ── Panel superior ───────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (ancho, 60), (20, 15, 10), -1)
    cv2.putText(frame, "DETECTOR DE COLOR DE VEHICULO", (15, 22),
                cv2.FONT_HERSHEY_DUPLEX, 0.6, (0, 215, 255), 1)
    cv2.putText(frame, f"Color detectado: {color_actual} ({porcentaje_act:.1f}%)",
                (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_display, 2)
 
    # ── Barra de colores en el lado derecho ──────────────────
    sorted_colors = sorted(todos.items(), key=lambda x: x[1], reverse=True)[:6]
    total_px      = roi.shape[0] * roi.shape[1]
 
    for i, (nombre, px) in enumerate(sorted_colors):
        pct     = (px / total_px) * 100
        barra_w = int(pct * 2)
        y_pos   = 80 + i * 35
        bgr     = COLORES_BGR.get(nombre, (200, 200, 200))
 
        cv2.rectangle(frame, (ancho - 200, y_pos),
                      (ancho - 200 + max(barra_w, 3), y_pos + 20), bgr, -1)
        cv2.putText(frame, f"{nombre}: {pct:.1f}%",
                    (ancho - 200, y_pos - 3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, bgr, 1)
 
    # ── Color dominante grande ───────────────────────────────
    cv2.rectangle(frame, (10, alto - 70), (300, alto - 10), color_display, -1)
    cv2.putText(frame, color_actual.upper(), (20, alto - 28),
                cv2.FONT_HERSHEY_DUPLEX, 1.0,
                (0, 0, 0) if color_actual in ["Blanco", "Amarillo", "Plateado"] else (255, 255, 255),
                2)
 
    cv2.imshow("Detector de Color", frame)
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
 
cap.release()
cv2.destroyAllWindows()
print(f"Color final: {color_actual}")