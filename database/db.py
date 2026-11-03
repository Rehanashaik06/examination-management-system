"""Database helpers. Set DATABASE_PATH to share a database with the app/tests."""
from contextlib import contextmanager
import os
from pathlib import Path
import sqlite3

PACKAGE_DIR = Path(__file__).resolve().parent


def get_db_path():
    """Return the configured absolute database path (independent of cwd)."""
    return Path(os.environ.get("DATABASE_PATH", PACKAGE_DIR / "online_exam.db")).expanduser().resolve()


def get_connection(path=None):
    """Open a row-addressable SQLite connection with FK checks enabled."""
    db_path = Path(path).expanduser().resolve() if path is not None else get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def connection(path=None):
    """Yield a connection; commit on success, rollback on error, always close."""
    conn = get_connection(path)
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def init_db(path=None):
    """Create schema idempotently and return the resolved database path."""
    schema = (PACKAGE_DIR / "schema.sql").read_text(encoding="utf-8")
    with connection(path) as conn:
        conn.executescript(schema)
    return Path(path).expanduser().resolve() if path is not None else get_db_path()


def get_db():
    """Get the request-scoped connection for Flask; pair with close_db."""
    from flask import current_app, g
    if "db" not in g:
        g.db = get_connection(current_app.config.get("DATABASE_PATH"))
    return g.db


def close_db(_error=None):
    from flask import g
    db = g.pop("db", None)
    if db is not None:
        db.close()
