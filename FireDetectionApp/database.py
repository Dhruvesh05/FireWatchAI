"""
database.py — SQLite setup for ForestGuard AI
Uses Python built-in sqlite3 only. No SQLAlchemy.
"""
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'data', 'firewatch.db')


def get_db():
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # rows accessible by column name
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables if they do not exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            password_hash TEXT  NOT NULL,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS detections (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            detection_type  TEXT    NOT NULL,
            fire_count      INTEGER DEFAULT 0,
            smoke_count     INTEGER DEFAULT 0,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS telegram_alerts (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER,
            detection_id    INTEGER,
            alert_type      TEXT,
            message         TEXT,
            status          TEXT    NOT NULL,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)     REFERENCES users(id),
            FOREIGN KEY (detection_id) REFERENCES detections(id)
        );
    """)

    conn.commit()
    conn.close()
    print(f"[DB] Initialized at {DB_PATH}")


# ── User helpers ─────────────────────────────────────────────────────────────

def create_user(name: str, email: str, password_hash: str) -> int:
    """Insert a new user. Returns the new row id."""
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, password_hash)
    )
    conn.commit()
    user_id = c.lastrowid
    conn.close()
    return user_id


def get_user_by_email(email: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email.lower(),)).fetchone()
    conn.close()
    return row


def get_user_by_email_or_name(identifier: str):
    conn = get_db()
    identifier = identifier.strip().lower()
    row = conn.execute(
        "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?",
        (identifier, identifier)
    ).fetchone()
    conn.close()
    return row


def get_user_by_id(user_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row


# ── Detection helpers ────────────────────────────────────────────────────────

def record_detection(user_id: int, detection_type: str,
                     fire_count: int, smoke_count: int) -> int:
    """Insert a detection record. Returns the new row id."""
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """INSERT INTO detections (user_id, detection_type, fire_count, smoke_count)
           VALUES (?, ?, ?, ?)""",
        (user_id, detection_type, fire_count, smoke_count)
    )
    conn.commit()
    det_id = c.lastrowid
    conn.close()
    return det_id


# ── Alert helpers ────────────────────────────────────────────────────────────

def record_alert(user_id, detection_id, alert_type: str,
                 message: str, status: str) -> int:
    """Log a Telegram alert attempt."""
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """INSERT INTO telegram_alerts
               (user_id, detection_id, alert_type, message, status)
           VALUES (?, ?, ?, ?, ?)""",
        (user_id, detection_id, alert_type, message, status)
    )
    conn.commit()
    alert_id = c.lastrowid
    conn.close()
    return alert_id


# ── Statistics & Query Helpers ────────────────────────────────────────────────

def get_user_stats(user_id=None):
    """Get aggregated detection and alert statistics."""
    conn = get_db()
    if user_id:
        total_det = conn.execute("SELECT COUNT(*) as cnt FROM detections WHERE user_id = ?", (user_id,)).fetchone()['cnt']
        fire_sum  = conn.execute("SELECT COALESCE(SUM(fire_count), 0) as cnt FROM detections WHERE user_id = ?", (user_id,)).fetchone()['cnt']
        smoke_sum = conn.execute("SELECT COALESCE(SUM(smoke_count), 0) as cnt FROM detections WHERE user_id = ?", (user_id,)).fetchone()['cnt']
        alerts_sent = conn.execute("SELECT COUNT(*) as cnt FROM telegram_alerts WHERE user_id = ? AND status = 'sent'", (user_id,)).fetchone()['cnt']
    else:
        total_det = conn.execute("SELECT COUNT(*) as cnt FROM detections").fetchone()['cnt']
        fire_sum  = conn.execute("SELECT COALESCE(SUM(fire_count), 0) as cnt FROM detections").fetchone()['cnt']
        smoke_sum = conn.execute("SELECT COALESCE(SUM(smoke_count), 0) as cnt FROM detections").fetchone()['cnt']
        alerts_sent = conn.execute("SELECT COUNT(*) as cnt FROM telegram_alerts WHERE status = 'sent'").fetchone()['cnt']
    conn.close()
    return {
        'total_detections': total_det,
        'fire_detections': fire_sum,
        'smoke_detections': smoke_sum,
        'alerts_sent': alerts_sent
    }


def get_user_history(user_id=None, limit=50):
    """Get recent detection history records with alert status."""
    conn = get_db()
    query = """
        SELECT d.id, d.user_id, d.detection_type, d.fire_count, d.smoke_count, d.created_at,
               u.name as user_name,
               (SELECT status FROM telegram_alerts WHERE detection_id = d.id ORDER BY id DESC LIMIT 1) as alert_status
        FROM detections d
        LEFT JOIN users u ON d.user_id = u.id
    """
    params = []
    if user_id:
        query += " WHERE d.user_id = ?"
        params.append(user_id)
    query += " ORDER BY d.created_at DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_user_analytics(user_id=None):
    """Get chart data for analytics."""
    conn = get_db()
    
    # 1. Type breakdown
    query_sources = "SELECT detection_type, COUNT(*) as count FROM detections"
    params = []
    if user_id:
        query_sources += " WHERE user_id = ?"
        params.append(user_id)
    query_sources += " GROUP BY detection_type"
    sources_rows = conn.execute(query_sources, params).fetchall()

    # 2. Timeline (detections grouped by date)
    query_timeline = "SELECT DATE(created_at) as date, SUM(fire_count) as fire, SUM(smoke_count) as smoke, COUNT(*) as total FROM detections"
    params_timeline = []
    if user_id:
        query_timeline += " WHERE user_id = ?"
        params_timeline.append(user_id)
    query_timeline += " GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14"
    timeline_rows = conn.execute(query_timeline, params_timeline).fetchall()

    conn.close()
    return {
        'sources': [dict(r) for r in sources_rows],
        'timeline': [dict(r) for r in timeline_rows]
    }


def get_user_alerts(user_id=None, limit=50):
    """Get telegram alert logs."""
    conn = get_db()
    query = """
        SELECT a.id, a.user_id, a.detection_id, a.alert_type, a.message, a.status, a.created_at,
               d.detection_type, d.fire_count, d.smoke_count
        FROM telegram_alerts a
        LEFT JOIN detections d ON a.detection_id = d.id
    """
    params = []
    if user_id:
        query += " WHERE a.user_id = ?"
        params.append(user_id)
    query += " ORDER BY a.created_at DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]

