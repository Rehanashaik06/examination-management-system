import os
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent

DATABASE_PATH = Path(
    os.getenv(
        "DATABASE_PATH",
        PROJECT_DIR / "database" / "online_exam.db"
    )
).expanduser().resolve()