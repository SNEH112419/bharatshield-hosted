import os
import sys

from app.local_security import connect, create_user

if os.environ.get("BHARATSHIELD_HOSTED") != "1":
    raise SystemExit("This startup script requires hosted mode.")

password = os.environ.pop("BHARATSHIELD_ADMIN_PASSWORD", "")

db = connect()
try:
    exists = db.execute(
        "SELECT username FROM users WHERE username = ?",
        ("admin",),
    ).fetchone()
finally:
    db.close()

if exists is None:
    if len(password) < 12:
        raise SystemExit(
            "Set BHARATSHIELD_ADMIN_PASSWORD to at least 12 characters."
        )
    create_user("admin", "Project Supervisor", password, "supervisor")
    print("Hosted supervisor account created.", flush=True)

del password

os.execv(
    sys.executable,
    [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", os.environ.get("PORT", "8000"),
        "--workers", "1",
        "--no-proxy-headers",
    ],
)