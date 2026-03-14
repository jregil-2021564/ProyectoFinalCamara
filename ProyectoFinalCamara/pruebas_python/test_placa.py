"""
test_placa.py
─────────────────────────────────────────────────────────────
Prueba la lectura de placa con Gemini.

Uso:
  py test_placa.py                      ← toma foto desde la cámara (DroidCam)
  py test_placa.py foto.jpg             ← usa una imagen existente
  py test_placa.py --camara 0           ← usa la webcam local (índice 0)
"""

import sys
import os
import time
import cv2
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ── Configuración ─────────────────────────────────────────
CAMARA_URL     = os.getenv("DROIDCAM_URL", "http://10.151.233.201:4747/video")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ── Inicializar Gemini ────────────────────────────────────
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY no encontrada en .env")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)
print("✅ Gemini conectado")


# ── Función principal: analizar imagen ───────────────────
def analizar_placa(imagen_path: str):
    print(f"\n📸 Analizando imagen: {imagen_path}")

    with open(imagen_path, "rb") as f:
        img_bytes = f.read()

    prompt = (
        "Eres un experto en placas vehiculares de Guatemala. "
        "Analiza esta imagen con MÁXIMO detalle y enfócate en encontrar la placa del vehículo. "
        "Responde ÚNICAMENTE con este formato, sin texto extra:\n\n"
        "PLACA: [número exacto de placa, ej: P-123ABC o 123-ABC]\n"
        "MODELO: [marca y modelo del vehículo]\n"
        "AÑO: [año o rango aproximado]\n"
        "COLOR: [color principal del vehículo]\n"
        "CONFIANZA_PLACA: [Alta / Media / Baja]\n"
        "RAZON: [explica brevemente qué ves en la placa]\n\n"
        "Si la placa no es visible escribe: PLACA: No visible"
    )

    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            prompt,
        ]
    )

    texto = response.text.strip()
    print("\n" + "="*50)
    print("🤖 RESPUESTA GEMINI:")
    print("="*50)
    print(texto)
    print("="*50)

    # Parsear resultado
    resultado = {}
    for linea in texto.split("\n"):
        if ":" in linea:
            clave, _, valor = linea.partition(":")
            resultado[clave.strip().upper()] = valor.strip()

    placa = resultado.get("PLACA", "No detectada")
    print(f"\n✅ PLACA DETECTADA: {placa}")
    return placa


# ── Capturar desde cámara ─────────────────────────────────
def capturar_foto(fuente):
    print(f"\n📷 Conectando a cámara: {fuente}")
    cap = cv2.VideoCapture(fuente)

    if not cap.isOpened():
        print("❌ No se pudo abrir la cámara")
        sys.exit(1)

    print("✅ Cámara abierta")
    print("─── Presiona ESPACIO para capturar foto, Q para salir ───")

    foto_guardada = None

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ No se pudo leer frame")
            break

        frame_show = cv2.resize(frame, (640, 480))
        cv2.putText(frame_show, "ESPACIO = capturar foto    Q = salir",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 215, 255), 2)
        cv2.putText(frame_show, "Apunta la camara a la placa del vehiculo",
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        cv2.imshow("Test Placa - Gemini", frame_show)

        key = cv2.waitKey(1) & 0xFF

        if key == ord(' '):
            nombre = f"foto_placa_{int(time.time())}.jpg"
            cv2.imwrite(nombre, frame)
            print(f"\n📸 Foto guardada: {nombre}")
            foto_guardada = nombre
            break

        elif key == ord('q'):
            print("Saliendo...")
            break

    cap.release()
    cv2.destroyAllWindows()
    return foto_guardada


# ── Main ──────────────────────────────────────────────────
if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        # Sin argumentos → capturar desde DroidCam
        foto = capturar_foto(CAMARA_URL)
        if foto:
            analizar_placa(foto)

    elif args[0] == "--camara":
        # --camara 0 → webcam local
        indice = int(args[1]) if len(args) > 1 else 0
        foto = capturar_foto(indice)
        if foto:
            analizar_placa(foto)

    else:
        # Archivo de imagen directo
        ruta = args[0]
        if not os.path.exists(ruta):
            print(f"❌ Archivo no encontrado: {ruta}")
            sys.exit(1)
        analizar_placa(ruta)