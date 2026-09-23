"""
sendtelegram.py — Telegram alert service for ForestGuard AI
- Reads credentials from .env (never hardcoded)
- Cooldown prevents per-frame spam
- All failures are caught; detection never crashes
- Every attempt is logged to telegram_alerts table
"""
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
CHAT_ID   = os.getenv("CHAT_ID", "")

try:
    _COOLDOWN = int(os.getenv("TELEGRAM_ALERT_COOLDOWN", "60"))
except ValueError:
    _COOLDOWN = 60

# In-memory last-alert timestamp (per detection source)
_last_alert: dict[str, float] = {}


def _is_configured() -> bool:
    return bool(BOT_TOKEN and CHAT_ID)


def _send_raw(message: str) -> bool:
    """Send a message to Telegram. Returns True on success."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        r = requests.post(
            url,
            data={"chat_id": CHAT_ID, "text": message},
            timeout=10
        )
        return r.status_code == 200
    except Exception as e:
        print(f"[Telegram] Request failed: {e}")
        return False


def maybe_send_fire_alert(
    source: str,
    fire_count: int,
    smoke_count: int,
    user_id=None,
    detection_id=None,
) -> str:
    """
    Conditionally send a fire alert with cooldown enforcement.

    Returns one of: 'sent' | 'skipped' | 'failed' | 'disabled'
    The return value is also logged to telegram_alerts.
    """
    from database import record_alert   # late import to avoid circular dependency

    now = time.time()
    last = _last_alert.get(source, 0)

    # Build the message text regardless (used for logging)
    ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
    message = (
        f"🔥 FIRE DETECTED\n"
        f"Source: {source}\n"
        f"Fire count: {fire_count}\n"
        f"Smoke count: {smoke_count}\n"
        f"Time: {ts}"
    )

    if not _is_configured():
        status = "disabled"
        print(f"[Telegram] Credentials not configured — alert skipped.")
    elif (now - last) < _COOLDOWN:
        status = "skipped"
        remaining = int(_COOLDOWN - (now - last))
        print(f"[Telegram] Cooldown active — {remaining}s remaining, alert skipped.")
    else:
        success = _send_raw(message)
        if success:
            _last_alert[source] = now
            status = "sent"
            print(f"[Telegram] Alert sent for {source}.")
        else:
            status = "failed"
            print(f"[Telegram] Alert failed for {source}.")

    # Log to DB (silently — never crash the app)
    try:
        record_alert(
            user_id=user_id,
            detection_id=detection_id,
            alert_type="fire",
            message=message,
            status=status,
        )
    except Exception as e:
        print(f"[Telegram] DB log failed: {e}")

    return status
