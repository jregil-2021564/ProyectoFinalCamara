import cv2
import numpy as np
import time
 
print("Iniciando Sistema de Control de Tráfico...")
cap = cv2.VideoCapture("http://192.168.1.15:4747/video")
print("Camara abierta:", cap.isOpened())
 
cap.set(cv2.CAP_PROP_ZOOM, 0)
 
# Colores profesionales
AZUL_OSCURO   = (45, 30, 20)
AZUL_PANEL    = (80, 60, 40)
BLANCO        = (255, 255, 255)
GRIS          = (180, 180, 180)
VERDE         = (50, 205, 50)
ROJO          = (50, 50, 220)
AMARILLO      = (0, 215, 255)
NEGRO         = (0, 0, 0)
 
multas_count = 0
inicio = time.time()
 
def dibujar_panel(frame, pixeles_rojos, es_rojo, multas):
    alto, ancho = frame.shape[:2]
 
    # ── Barra superior ──────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (ancho, 70), (25, 20, 15), -1)
    cv2.rectangle(frame, (0, 68), (ancho, 70), AMARILLO, -1)  # línea dorada
 
    cv2.putText(frame, "SISTEMA DE CONTROL DE TRANSITO", (15, 28),
                cv2.FONT_HERSHEY_DUPLEX, 0.75, AMARILLO, 1)
    cv2.putText(frame, "Deteccion de Semaforo en Rojo", (15, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GRIS, 1)
 
    # Hora en barra superior derecha
    hora = time.strftime("%H:%M:%S")
    cv2.putText(frame, hora, (ancho - 120, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, BLANCO, 1)
 
    # ── Panel inferior ───────────────────────────────────────────
    panel_y = alto - 110
    cv2.rectangle(frame, (0, panel_y), (ancho, alto), (25, 20, 15), -1)
    cv2.rectangle(frame, (0, panel_y), (ancho, panel_y + 2), AMARILLO, -1)
 
    # Bloque ESTADO
    cv2.rectangle(frame, (10, panel_y + 8), (280, panel_y + 95), AZUL_PANEL, -1)
    cv2.rectangle(frame, (10, panel_y + 8), (280, panel_y + 95), AMARILLO, 1)
    cv2.putText(frame, "ESTADO SEMAFORO", (18, panel_y + 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GRIS, 1)
 
    if es_rojo:
        color_estado = ROJO
        texto_estado = "  ROJO - MULTA"
        icono = "(!)"
    else:
        color_estado = VERDE
        texto_estado = "  VERDE - OK"
        icono = ""
 
    cv2.putText(frame, icono, (18, panel_y + 55),
                cv2.FONT_HERSHEY_DUPLEX, 0.9, color_estado, 2)
    cv2.putText(frame, texto_estado, (18, panel_y + 75),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, color_estado, 2)
 
    # Bloque PIXELES
    cv2.rectangle(frame, (295, panel_y + 8), (530, panel_y + 95), AZUL_PANEL, -1)
    cv2.rectangle(frame, (295, panel_y + 8), (530, panel_y + 95), AMARILLO, 1)
    cv2.putText(frame, "INTENSIDAD ROJO", (303, panel_y + 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GRIS, 1)
    cv2.putText(frame, f"{pixeles_rojos} px", (303, panel_y + 70),
                cv2.FONT_HERSHEY_DUPLEX, 0.8, BLANCO, 2)
 
    # Barra de intensidad
    max_px = 8000
    barra_w = int(min(pixeles_rojos / max_px, 1.0) * 220)
    cv2.rectangle(frame, (303, panel_y + 78), (523, panel_y + 88), (50,50,50), -1)
    bar_color = ROJO if es_rojo else VERDE
    if barra_w > 0:
        cv2.rectangle(frame, (303, panel_y + 78), (303 + barra_w, panel_y + 88), bar_color, -1)
 
    # Bloque MULTAS
    cv2.rectangle(frame, (545, panel_y + 8), (780, panel_y + 95), AZUL_PANEL, -1)
    cv2.rectangle(frame, (545, panel_y + 8), (780, panel_y + 95), AMARILLO, 1)
    cv2.putText(frame, "MULTAS DETECTADAS", (553, panel_y + 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GRIS, 1)
    cv2.putText(frame, str(multas), (600, panel_y + 75),
                cv2.FONT_HERSHEY_DUPLEX, 1.2, AMARILLO, 2)
 
    # ── Zona semáforo con esquinas ────────────────────────────────
    h2, w2 = int(alto * 0.6), int(ancho * 0.6)
    grosor = 2
    largo = 25
    c = AMARILLO if not es_rojo else ROJO
 
    # Esquinas del recuadro
    pts = [(0,0),(w2,0),(0,h2),(w2,h2)]
    dirs = [(1,1),(-1,1),(1,-1),(-1,-1)]
    for (px,py),(dx,dy) in zip(pts, dirs):
        cv2.line(frame, (px, py), (px + dx*largo, py), c, grosor+1)
        cv2.line(frame, (px, py), (px, py + dy*largo), c, grosor+1)
 
    cv2.putText(frame, "ZONA DETECCION", (8, h2 - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, c, 1)
 
    # ── Alerta central si hay multa ───────────────────────────────
    if es_rojo:
        overlay = frame.copy()
        cv2.rectangle(overlay, (ancho//2 - 200, alto//2 - 40),
                      (ancho//2 + 200, alto//2 + 40), (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, "!  INFRACCION DETECTADA  !", (ancho//2 - 185, alto//2 + 10),
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, BLANCO, 2)
 
    return frame
 
 
ultimo_rojo = False
 
while True:
    ret, frame = cap.read()
    if not ret:
        continue
 
    alto, ancho = frame.shape[:2]
    roi = frame[0:int(alto*0.6), 0:int(ancho*0.6)]
 
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask1 = cv2.inRange(hsv, np.array([0, 150, 150]),  np.array([8, 255, 255]))
    mask2 = cv2.inRange(hsv, np.array([172, 150, 150]), np.array([180, 255, 255]))
    mask_rojo = mask1 + mask2
    pixeles_rojos = cv2.countNonZero(mask_rojo)
 
    es_rojo = pixeles_rojos > 3000
 
    # Contar multa solo cuando cambia de verde a rojo
    if es_rojo and not ultimo_rojo:
        multas_count += 1
        print(f" MULTA #{multas_count} - Semaforo en rojo! px:{pixeles_rojos}")
 
    ultimo_rojo = es_rojo
 
    frame = dibujar_panel(frame, pixeles_rojos, es_rojo, multas_count)
    cv2.imshow("Sistema Control de Transito", frame)
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
 
cap.release()
cv2.destroyAllWindows()