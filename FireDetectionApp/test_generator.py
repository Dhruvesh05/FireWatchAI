"""
Minimal standalone test of the generator logic to find the crash.
"""
import os, sys, time, traceback
os.chdir(r'c:\Users\dhruv\Forest-fire-detection-using-YOLOv8\FireDetectionApp')
sys.path.insert(0, r'c:\Users\dhruv\Forest-fire-detection-using-YOLOv8\FireDetectionApp')

# Minimal stubs so we can import without full Flask context
os.environ['CUDA_VISIBLE_DEVICES'] = ''
from dotenv import load_dotenv
load_dotenv()

import cv2
import numpy as np
from ultralytics import YOLO

BASE_DIR   = r'c:\Users\dhruv\Forest-fire-detection-using-YOLOv8\FireDetectionApp'
MODEL_PATH = os.path.join(BASE_DIR, 'weights', 'best.pt')
CLASS_MAP  = {0: 'Smoke', 1: 'Fire'}
COLORS     = {'Fire': (0, 0, 255), 'Smoke': (0, 255, 255)}

print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
model.to('cpu')
print("Model loaded.")

def annotate_frame(frame):
    results = model(frame)[0]
    fire_count = 0
    smoke_count = 0
    for det in results.boxes:
        cls_id   = int(det.cls[0])
        cls_name = CLASS_MAP.get(cls_id, f"Class {cls_id}")
        x1, y1, x2, y2 = map(int, det.xyxy[0])
        conf  = float(det.conf[0])
        color = COLORS.get(cls_name, (255, 255, 255))
        if cls_name == 'Fire':
            fire_count += 1
        elif cls_name == 'Smoke':
            smoke_count += 1
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    return frame, fire_count, smoke_count

print("\nOpening camera...")
cap = cv2.VideoCapture(0)
print(f"Opened: {cap.isOpened()}")

print("Waiting 1s for MSMF init...")
time.sleep(1.0)

print("Reading 3 frames with YOLO annotation:")
for i in range(3):
    try:
        ret, frame = cap.read()
        print(f"  Frame {i+1}: ret={ret}, shape={frame.shape if ret else None}")
        if ret:
            frame, fc, sc = annotate_frame(frame)
            ret2, buf = cv2.imencode('.jpg', frame)
            print(f"  Annotated: fire={fc}, smoke={sc}, encoded={ret2}, jpg_size={len(buf) if ret2 else 0}")
    except Exception as e:
        print(f"  EXCEPTION on frame {i+1}: {e}")
        traceback.print_exc()

cap.release()
print("\nDone.")
