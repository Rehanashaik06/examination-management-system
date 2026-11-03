import sqlite3

import pytest

from database.db import get_connection, init_db
from database.seed import seed_demo


def test_schema_foreign_keys_and_invalid_reference(tmp_path):
    path = tmp_path / "nested" / "test.db"
    init_db(path)
    conn = get_connection(path)
    try:
        names = {r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {"users", "exams", "questions", "attempts", "answers"} <= names
        assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute("INSERT INTO questions(exam_id,question_text,option_a,option_b,option_c,option_d,correct_option) VALUES(999,'q','a','b','c','d','A')")
    finally:
        conn.close()


def test_seed_is_repeatable(tmp_path):
    path = tmp_path / "seed.db"
    seed_demo(path); seed_demo(path)
    conn = get_connection(path)
    try:
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 2
        assert conn.execute("SELECT COUNT(*) FROM exams").fetchone()[0] == 1
        assert conn.execute("SELECT COUNT(*) FROM questions").fetchone()[0] == 5
    finally:
        conn.close()
