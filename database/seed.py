
"""Idempotent demo seed. Run with `python -m database.seed`."""

import os

from werkzeug.security import generate_password_hash

from database.db import connection, init_db


def seed_demo(path=None):
    init_db(path)

    with connection(path) as conn:

        # Create demo admin if it does not already exist.
        conn.execute(
            """
            INSERT OR IGNORE INTO users
                (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
            """,
            (
                "Demo Admin",
                "admin@example.test",
                generate_password_hash(
                    os.environ.get("DEMO_ADMIN_PASSWORD", "DemoAdmin123!")
                ),
                "admin",
            ),
        )

        # Create demo student if it does not already exist.
        conn.execute(
            """
            INSERT OR IGNORE INTO users
                (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
            """,
            (
                "Demo Student",
                "student@example.test",
                generate_password_hash(
                    os.environ.get("DEMO_STUDENT_PASSWORD", "DemoStudent123!")
                ),
                "student",
            ),
        )

        # Get the demo admin ID.
        admin = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            ("admin@example.test",),
        ).fetchone()

        # Check whether the demo exam already exists.
        exam = conn.execute(
            "SELECT id FROM exams WHERE title = ?",
            ("Python Fundamentals",),
        ).fetchone()

        # Insert the exam only if it does not exist.
        if exam is None:
            cursor = conn.execute(
                """
                INSERT INTO exams (
                    title,
                    description,
                    duration_minutes,
                    is_published,
                    created_by
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    "Python Fundamentals",
                    "Demo assessment covering Python basics",
                    20,
                    1,
                    admin["id"],
                ),
            )
            exam_id = cursor.lastrowid
        else:
            exam_id = exam["id"]

        # Demo questions.
        questions = [
            (
                "Which keyword defines a function?",
                "func", "def", "function", "define", "B", 1
            ),
            (
                "Which type stores key-value pairs?",
                "list", "tuple", "dict", "set", "C", 1
            ),
            (
                "What does len([1, 2, 3]) return?",
                "2", "3", "4", "Error", "B", 1
            ),
            (
                "Which literal represents no value?",
                "None", "null", "void", "empty", "A", 1
            ),
            (
                "Which symbol starts a comment?",
                "//", "#", "<!--", "**", "B", 1
            ),
        ]

        # Insert only questions that do not already exist.
        for question in questions:
            exists = conn.execute(
                """
                SELECT 1
                FROM questions
                WHERE exam_id = ? AND question_text = ?
                """,
                (exam_id, question[0]),
            ).fetchone()

            if exists is None:
                conn.execute(
                    """
                    INSERT INTO questions (
                        exam_id,
                        question_text,
                        option_a,
                        option_b,
                        option_c,
                        option_d,
                        correct_option,
                        marks
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (exam_id, *question),
                )


if __name__ == "__main__":
    seed_demo()

    print(
        "Demo data initialized successfully.\n"
        "Demo admin: admin@example.test\n"
        "Demo student: student@example.test\n"
        "Override passwords using DEMO_ADMIN_PASSWORD "
        "and DEMO_STUDENT_PASSWORD.\n"
        "Never use demo credentials in production."
    )
