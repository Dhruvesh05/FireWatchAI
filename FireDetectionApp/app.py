"""
app.py — ForestGuard AI — Main Flask Application
Combines: image/video/webcam detection + auth + SQLite + Telegram alerts
"""
import os
import uuid
import threading
import time

import cv2
import numpy as np
from io import BytesIO

from flask import (
    Flask, render_template, request, send_file,
    Response, jsonify, session
)
from werkzeug.security import generate_password_hash, check_password_hash
from ultralytics import YOLO
from dotenv import load_dotenv

# ── Load env ──────────────────────────────────────────────────────────────────
load_dotenv()

# ── Disable GPU ───────────────────────────────────────────────────────────────
os.environ['CUDA_VISIBLE_DEVICES'] = ''

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
MODEL_PATH = os.path.join(BASE_DIR, 'weights', 'best.pt')

# ── Class map ─────────────────────────────────────────────────────────────────
CLASS_MAP = {0: 'Smoke', 1: 'Fire'}
COLORS    = {'Fire': (0, 0, 255), 'Smoke': (0, 255, 255)}

# ── Flask setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-change-in-production')

# ── YOLO model ────────────────────────────────────────────────────────────────
model = YOLO(MODEL_PATH)
model.to('cpu')

# ── DB init ───────────────────────────────────────────────────────────────────
from database import (
    init_db, create_user, get_user_by_email, get_user_by_email_or_name,
    get_user_by_id, record_detection, get_user_stats, get_user_history,
    get_user_analytics, get_user_alerts
)
from sendtelegram import maybe_send_fire_alert

init_db()

# ── Webcam state ──────────────────────────────────────────────────────────────
_webcam_active = False
_webcam_lock   = threading.Lock()
_webcam_frame_queue_size = 1   # keep only the latest frame

# ── Helpers ───────────────────────────────────────────────────────────────────

def annotate_frame(frame):
    """Run YOLO on a frame, draw boxes. Returns (annotated_frame, fire_count, smoke_count)."""
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
        text       = f"{cls_name} {conf:.2f}"
        font_scale = 0.8
        thickness  = 2
        text_size  = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)[0]
        cv2.putText(frame, text, (x1, y2 + text_size[1] + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness)

    return frame, fire_count, smoke_count


def current_user_id():
    return session.get('user_id')


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    name     = (data.get('name') or '').strip()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required.'}), 400
    if len(name) < 3:
        return jsonify({'error': 'Name must be at least 3 characters.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    if get_user_by_email(email):
        return jsonify({'error': 'An account with this email already exists.'}), 409

    pw_hash = generate_password_hash(password)
    try:
        user_id = create_user(name, email, pw_hash)
    except Exception as e:
        print(f"[Signup] DB error: {e}")
        return jsonify({'error': 'Account creation failed. Please try again.'}), 500

    session['user_id'] = user_id
    session['user_name'] = name
    return jsonify({'message': 'Account created successfully.', 'name': name}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'error': 'Email/Username and password are required.'}), 400

    user = get_user_by_email_or_name(identifier)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email/username or password.'}), 401

    session['user_id']   = user['id']
    session['user_name'] = user['name']
    return jsonify({'message': 'Logged in.', 'name': user['name']}), 200


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out.'}), 200


@app.route('/session')
def get_session():
    uid = current_user_id()
    if not uid:
        return jsonify({'authenticated': False}), 200
    user = get_user_by_id(uid)
    if not user:
        session.clear()
        return jsonify({'authenticated': False}), 200
    return jsonify({
        'authenticated': True,
        'id':    user['id'],
        'name':  user['name'],
        'email': user['email'],
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# IMAGE DETECTION
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/upload_image', methods=['POST'])
def upload_image():
    try:
        file = request.files.get('file')
        if not file:
            return "No file uploaded", 400

        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return "Image decode failed", 400

        img, fire_count, smoke_count = annotate_frame(img)

        # Record to DB if authenticated
        uid = current_user_id()
        det_id = None
        if uid:
            det_id = record_detection(uid, 'image', fire_count, smoke_count)

        # Telegram alert if fire detected
        if fire_count > 0:
            maybe_send_fire_alert(
                source='image',
                fire_count=fire_count,
                smoke_count=smoke_count,
                user_id=uid,
                detection_id=det_id,
            )

        _, buf = cv2.imencode('.png', img)
        return send_file(BytesIO(buf.tobytes()), mimetype='image/png')

    except Exception as e:
        print(f"[upload_image] Error: {e}")
        return str(e), 500


# ══════════════════════════════════════════════════════════════════════════════
# VIDEO DETECTION
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/upload_video', methods=['POST'])
def upload_video():
    file = request.files.get('file')
    if not file:
        return "No file uploaded", 400

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, 'live_input.mp4')
    file.save(save_path)

    # Store context for the video feed + DB recording
    app.config['CURRENT_VIDEO_PATH'] = save_path
    app.config['CURRENT_VIDEO_USER'] = current_user_id()
    return jsonify({"stream_url": "/video_feed"})


def _gen_video_frames(input_path, user_id):
    """Generator: yield MJPEG frames and accumulate fire/smoke totals."""
    cap = cv2.VideoCapture(input_path)
    total_fire  = 0
    total_smoke = 0
    frame_idx   = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        frame, fire_count, smoke_count = annotate_frame(frame)
        total_fire  += fire_count
        total_smoke += smoke_count
        frame_idx   += 1

        # Telegram alert (cooldown enforced inside maybe_send_fire_alert)
        if fire_count > 0:
            maybe_send_fire_alert(
                source='video',
                fire_count=fire_count,
                smoke_count=smoke_count,
                user_id=user_id,
                detection_id=None,
            )

        ret2, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
               + buffer.tobytes() + b'\r\n')

    cap.release()

    # Record aggregate to DB once the stream ends
    if user_id and (total_fire > 0 or total_smoke > 0):
        record_detection(user_id, 'video', total_fire, total_smoke)


@app.route('/video_feed')
def video_feed():
    video_path = app.config.get('CURRENT_VIDEO_PATH')
    user_id    = app.config.get('CURRENT_VIDEO_USER')
    if not video_path:
        return "No video loaded", 400
    return Response(
        _gen_video_frames(video_path, user_id),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# ══════════════════════════════════════════════════════════════════════════════
# WEBCAM DETECTION  (integrated — no second server needed)
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/webcam')
def webcam_page():
    return render_template('webcam.html')


@app.route('/webcam/start', methods=['POST'])
def webcam_start():
    global _webcam_active
    with _webcam_lock:
        _webcam_active = True
    return jsonify({'status': 'started'})


@app.route('/webcam/stop', methods=['POST'])
def webcam_stop():
    global _webcam_active
    with _webcam_lock:
        _webcam_active = False
    return jsonify({'status': 'stopped'})


def _gen_webcam_frames():
    """Generator: read from webcam 0, annotate, yield MJPEG."""
    global _webcam_active
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        yield b''
        return

    uid            = current_user_id()
    session_fire   = 0
    session_smoke  = 0

    try:
        while True:
            with _webcam_lock:
                active = _webcam_active
            if not active:
                break

            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(0.05)
                continue

            frame, fire_count, smoke_count = annotate_frame(frame)
            session_fire  += fire_count
            session_smoke += smoke_count

            if fire_count > 0:
                maybe_send_fire_alert(
                    source='webcam',
                    fire_count=fire_count,
                    smoke_count=smoke_count,
                    user_id=uid,
                    detection_id=None,
                )

            ret2, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
                   + buffer.tobytes() + b'\r\n')
    finally:
        cap.release()
        with _webcam_lock:
            _webcam_active = False

        if uid and (session_fire > 0 or session_smoke > 0):
            record_detection(uid, 'webcam', session_fire, session_smoke)


@app.route('/webcam_feed')
def webcam_feed():
    return Response(
        _gen_webcam_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# ══════════════════════════════════════════════════════════════════════════════
# DATA API ENDPOINTS (READ-ONLY FOR DASHBOARD/HISTORY/ANALYTICS/ALERTS)
# ══════════════════════════════════════════════════════════════════════════════

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response


@app.route('/api/health')
def api_health():
    return jsonify({'status': 'online', 'service': 'FireWatch AI Platform'})


@app.route('/api/stats')
def api_stats():
    uid = current_user_id()
    data = get_user_stats(uid)
    return jsonify(data)


@app.route('/api/history')
def api_history():
    uid = current_user_id()
    history = get_user_history(uid)
    return jsonify(history)


@app.route('/api/analytics')
def api_analytics():
    uid = current_user_id()
    analytics = get_user_analytics(uid)
    return jsonify(analytics)


@app.route('/api/alerts')
def api_alerts():
    uid = current_user_id()
    alerts = get_user_alerts(uid)
    return jsonify(alerts)


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def run_app():
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


if __name__ == '__main__':
    run_app()
