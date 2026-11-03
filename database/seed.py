"""Idempotent demo seed. Run with `python -m database.seed`."""
import os

from werkzeug.security import generate_password_hash

from database.db import connection, init_db


def seed_demo(path=None):
    init_db(path)
    with connection(path) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
            ("Demo Admin", "admin@example.test", generate_password_hash(os.environ.get("DEMO_ADMIN_PASSWORD", "DemoAdmin123!")), "admin"),
        )
        conn.execute(
            "INSERT OR IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
            ("Demo Student", "student@example.test", generate_password_hash(os.environ.get("DEMO_STUDENT_PASSWORD", "DemoStudent123!")), "student"),
        )
        admin = conn.execute("SELECT id FROM users WHERE email=?", ("admin@example.test",)).fetchone()
        conn.execute(
            "INSERT OR IGNORE INTO exams(title,description,duration_minutes,is_published,created_by) VALUES(?,?,?,?,?)",
            ("Python Fundamentals", "Demo assessment covering Python basics", 20, 1, admin["id"]),
        )
        exam = conn.execute("SELECT id FROM exams WHERE title=?", ("Python Fundamentals",)).fetchone()
        questions = [
            ("Which keyword defines a function?", "func", "def", "function", "define", "B", 1),
            ("Which type stores key-value pairs?", "list", "tuple", "dict", "set", "C", 1),
            ("What does len([1, 2, 3]) return?", "2", "3", "4", "Error", "B", 1),
            ("Which literal represents no value?", "None", "null", "void", "empty", "A", 1),
            ("Which symbol starts a comment?", "//", "#", "<!--", "**", "B", 1),
        ]
        for q in questions:
            exists = conn.execute("SELECT 1 FROM questions WHERE exam_id=? AND question_text=?", (exam["id"], q[0])).fetchone()
            if not exists:
                conn.execute("INSERT INTO questions(exam_id,question_text,option_a,option_b,option_c,option_d,correct_option,marks) VALUES(?,?,?,?,?,?,?,?)", (exam["id"], *q))


if __name__ == "__main__":
    seed_demo()
    print("Demo data initialized. Demo-only accounts: admin@example.test / DemoAdmin123! and student@example.test / DemoStudent123!. Override with DEMO_ADMIN_PASSWORD and DEMO_STUDENT_PASSWORD. Never use these credentials in production.")
