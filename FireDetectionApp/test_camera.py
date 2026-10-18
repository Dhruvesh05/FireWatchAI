"""
Quick camera diagnostic — run with the venv Python to confirm which
index/backend works before starting the Flask app.
"""
import cv2
import sys

BACKENDS = [
    ('CAP_DSHOW (DirectShow)',  cv2.CAP_DSHOW),
    ('CAP_MSMF (Media Foundation)', cv2.CAP_MSMF),
    ('Default (Auto)',          0),
]

print(f"OpenCV version: {cv2.__version__}\n")

found = False
for idx in range(3):
    for backend_name, backend in BACKENDS:
        print(f"Testing camera index={idx}, backend={backend_name} ...", end=" ", flush=True)
        try:
            cap = cv2.VideoCapture(idx, backend) if backend != 0 else cv2.VideoCapture(idx)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    print(f"OK  [{w}x{h}]  <-- USE THIS")
                    found = True
                else:
                    print("Opened but no frames.")
                cap.release()
            else:
                print("Could not open.")
        except Exception as e:
            print(f"Error: {e}")

if not found:
    print("\n[ERROR] No working camera found. Make sure your webcam is plugged in and not used by another app.")
    sys.exit(1)
else:
    print("\n[OK] Camera detected. Flask app should work.")
