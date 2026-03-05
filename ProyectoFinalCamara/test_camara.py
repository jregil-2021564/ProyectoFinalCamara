import cv2

print("Intentando conectar a la cámara...")

cap = cv2.VideoCapture("http://192.168.1.15:4747/video")

if not cap.isOpened():
    print("❌ No se pudo conectar a la cámara")
else:
    print("✅ Cámara conectada correctamente")

print("Leyendo frames...")

while True:
    ret, frame = cap.read()
    print(f"ret: {ret}, frame: {frame is not None}")
    
    if not ret:
        print("❌ No se recibe imagen")
        break
    
    cv2.imshow("Test Camara - Presiona Q para salir", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Programa terminado")