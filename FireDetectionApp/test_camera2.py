"""
Find the correct camera string for CAP_DSHOW on Windows (OpenCV 5+).
"""
import subprocess, re

result = subprocess.run(
    ['powershell', '-Command',
     'Get-PnpDevice -Class Camera | Select-Object FriendlyName, Status | Format-List'],
    capture_output=True, text=True
)
print("Camera PnP devices:\n", result.stdout)

# Also try listing via WMI
result2 = subprocess.run(
    ['powershell', '-Command',
     'Get-WmiObject Win32_PnPEntity | Where-Object {$_.PNPClass -eq "Camera"} | Select-Object Name, DeviceID | Format-List'],
    capture_output=True, text=True
)
print("Camera WMI:\n", result2.stdout)

# Try all VideoCapture approaches
import cv2
print(f"\nOpenCV version: {cv2.__version__}")

# Try API_PREFERENCE approach (OpenCV 5)
for api in [cv2.CAP_ANY, cv2.CAP_MSMF, cv2.CAP_DSHOW, cv2.CAP_V4L2]:
    try:
        name = {cv2.CAP_ANY: 'ANY', cv2.CAP_MSMF: 'MSMF', cv2.CAP_DSHOW: 'DSHOW', cv2.CAP_V4L2: 'V4L2'}.get(api, str(api))
        cap = cv2.VideoCapture(0, api)
        if cap.isOpened():
            import time; time.sleep(2.0)  # Wait longer for MSMF
            ret, frame = cap.read()
            cap.release()
            print(f"API {name}: isOpened=True, read={ret}, shape={frame.shape if ret else None}")
        else:
            print(f"API {name}: Could not open")
    except Exception as e:
        print(f"API {name}: Exception: {e}")
