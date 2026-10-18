"""
Direct endpoint test — calls /webcam/start then reads 3 frames from /webcam_feed.
Run with the venv Python while Flask is running on port 5000.
"""
import requests
import time

BASE = 'http://127.0.0.1:5000'

print("1. Calling /webcam/start ...")
r = requests.post(f'{BASE}/webcam/start', timeout=10)
print(f"   Status: {r.status_code}  Body: {r.text}")

if r.status_code != 200:
    print("ERROR: start failed, aborting.")
    exit(1)

time.sleep(0.6)

print("2. Connecting to /webcam_feed and reading first 3 MJPEG frames ...")
try:
    with requests.get(f'{BASE}/webcam_feed', stream=True, timeout=15) as resp:
        print(f"   Response status: {resp.status_code}")
        print(f"   Content-Type: {resp.headers.get('Content-Type')}")
        if resp.status_code != 200:
            print(f"   Body: {resp.text[:200]}")
            exit(1)

        frame_count = 0
        buf = b''
        for chunk in resp.iter_content(chunk_size=4096):
            buf += chunk
            while b'--frame' in buf:
                parts = buf.split(b'--frame', 1)
                buf = b'--frame' + parts[1]
                if b'\r\n\r\n' in buf:
                    header_end = buf.index(b'\r\n\r\n') + 4
                    # Look for next boundary
                    next_boundary = buf.find(b'--frame', header_end)
                    if next_boundary != -1:
                        jpeg_data = buf[header_end:next_boundary]
                        frame_count += 1
                        print(f"   Frame {frame_count}: {len(jpeg_data)} bytes")
                        buf = buf[next_boundary:]
                        if frame_count >= 3:
                            break
            if frame_count >= 3:
                break

        if frame_count == 0:
            print("ERROR: Got no frames!")
        else:
            print(f"\nSUCCESS: Received {frame_count} frames from the camera stream!")

except Exception as e:
    print(f"ERROR streaming: {e}")

print("3. Calling /webcam/stop ...")
r2 = requests.post(f'{BASE}/webcam/stop', timeout=5)
print(f"   Status: {r2.status_code}  Body: {r2.text}")
print("Done.")
