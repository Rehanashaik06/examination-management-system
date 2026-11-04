
import sqlite3
import sys
from pathlib import Path
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

# --------------------------------------------------
# PROJECT IMPORT CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from auth import check_password, generate_token, verify_token
from config import DATABASE_PATH
from database.db import connection


# --------------------------------------------------
# FLASK APPLICATION CONFIGURATION
# --------------------------------------------------

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"]
        }
    },
    supports_credentials=True
)


# --------------------------------------------------
# COMMON JSON RESPONSE
# --------------------------------------------------

def api_response(success, message, data=None):
    return jsonify({
        "success": success,
        "message": message,
        "data": data
    })


# --------------------------------------------------
# AUTHENTICATION HELPER
# --------------------------------------------------

def get_logged_in_user():

    # Read JWT from HttpOnly cookie
    token = request.cookies.get("access_token")

    # Bearer token fallback for PowerShell/API testing
    if not token:
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        return None

    return verify_token(token)


# --------------------------------------------------
# TIME HELPER
# --------------------------------------------------

def get_current_time():
    return datetime.now(timezone.utc)


# --------------------------------------------------
# 1. HOME API
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return api_response(
        True,
        "Online Examination System Backend is running",
        {
            "service": "Online Examination System",
            "backend": "Flask"
        }
    ), 200


# --------------------------------------------------
# 2. HEALTH CHECK API
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():

    return api_response(
        True,
        "Backend is running successfully",
        {
            "status": "healthy"
        }
    ), 200


# --------------------------------------------------
# 3. STUDENT / ADMIN LOGIN API
# --------------------------------------------------

@app.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str):
        return api_response(
            False,
            "Invalid input"
        ), 400

    email = email.strip().lower()

    if not email or not password:
        return api_response(
            False,
            "Email and password are required"
        ), 400

    try:
        with connection(DATABASE_PATH) as conn:

            user = conn.execute(
                """
                SELECT id, name, email, password_hash, role
                FROM users
                WHERE email = ?
                """,
                (email,)
            ).fetchone()

    except sqlite3.Error:
        return api_response(
            False,
            "Database error"
        ), 500

    if user is None or not check_password(
        password,
        user["password_hash"]
    ):
        return api_response(
            False,
            "Invalid email or password"
        ), 401

    token = generate_token(
        user["id"],
        user["role"]
    )

    response = api_response(
        True,
        "Login successful",
        {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    )

    # Store JWT in HttpOnly cookie
    response.set_cookie(
        "access_token",
        token,
        httponly=True,
        secure=False,       # Local development only
        samesite="Lax",
        max_age=7200,
        path="/"
    )

    return response, 200


# --------------------------------------------------
# 4. LOGOUT API
# --------------------------------------------------

@app.route("/api/auth/logout", methods=["POST"])
def logout():

    response = api_response(
        True,
        "Logout successful"
    )

    response.delete_cookie(
        "access_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="Lax"
    )

    return response, 200


# --------------------------------------------------
# 5. FETCH ALL PUBLISHED EXAMINATIONS API
# --------------------------------------------------

@app.route("/api/exams", methods=["GET"])
def get_exams():

    try:
        with connection(DATABASE_PATH) as conn:

            exams = conn.execute(
                """
                SELECT id, title, description, duration_minutes
                FROM exams
                WHERE is_published = 1
                ORDER BY id
                """
            ).fetchall()

        exam_list = [
            {
                "id": exam["id"],
                "title": exam["title"],
                "description": exam["description"],
                "duration_minutes": exam["duration_minutes"]
            }
            for exam in exams
        ]

        return api_response(
            True,
            "Examinations fetched successfully",
            {
                "exams": exam_list
            }
        ), 200

    except sqlite3.Error:
        return api_response(
            False,
            "Unable to fetch examinations"
        ), 500


# --------------------------------------------------
# 6. FETCH QUESTIONS FOR AN EXAMINATION API
# --------------------------------------------------

@app.route(
    "/api/exams/<int:exam_id>/questions",
    methods=["GET"]
)
def get_questions(exam_id):

    try:
        with connection(DATABASE_PATH) as conn:

            exam = conn.execute(
                """
                SELECT id, title
                FROM exams
                WHERE id = ? AND is_published = 1
                """,
                (exam_id,)
            ).fetchone()

            if exam is None:
                return api_response(
                    False,
                    "Examination not found"
                ), 404

            questions = conn.execute(
                """
                SELECT id, question_text, option_a, option_b,
                       option_c, option_d, marks
                FROM questions
                WHERE exam_id = ?
                ORDER BY id
                """,
                (exam_id,)
            ).fetchall()

        question_list = [
            {
                "id": q["id"],
                "question": q["question_text"],
                "options": {
                    "A": q["option_a"],
                    "B": q["option_b"],
                    "C": q["option_c"],
                    "D": q["option_d"]
                },
                "marks": q["marks"]
            }
            for q in questions
        ]

        return api_response(
            True,
            "Questions fetched successfully",
            {
                "exam_id": exam_id,
                "exam_title": exam["title"],
                "questions": question_list
            }
        ), 200

    except sqlite3.Error:
        return api_response(
            False,
            "Unable to fetch questions"
        ), 500


# --------------------------------------------------
# 7. START EXAMINATION API
# --------------------------------------------------

@app.route(
    "/api/exams/<int:exam_id>/start",
    methods=["POST"]
)
def start_exam(exam_id):

    user = get_logged_in_user()

    if not user:
        return api_response(
            False,
            "Invalid or missing authentication token"
        ), 401

    if user.get("role") != "student":
        return api_response(
            False,
            "Only students can start examinations"
        ), 403

    user_id = user.get("user_id")

    if user_id is None:
        return api_response(
            False,
            "Invalid user token"
        ), 401

    try:
        with connection(DATABASE_PATH) as conn:

            exam = conn.execute(
                """
                SELECT id, title, duration_minutes
                FROM exams
                WHERE id = ? AND is_published = 1
                """,
                (exam_id,)
            ).fetchone()

            if exam is None:
                return api_response(
                    False,
                    "Exam not found or not published"
                ), 404

            existing_attempt = conn.execute(
                """
                SELECT id, started_at, status
                FROM attempts
                WHERE user_id = ? AND exam_id = ?
                """,
                (user_id, exam_id)
            ).fetchone()

            if existing_attempt:

                if existing_attempt["status"] == "in_progress":

                    start_time = datetime.fromisoformat(
                        existing_attempt["started_at"].replace(
                            "Z", "+00:00"
                        )
                    )

                    elapsed = (
                        get_current_time() - start_time
                    ).total_seconds()

                    if elapsed >= exam["duration_minutes"] * 60:

                        conn.execute(
                            """
                            UPDATE attempts
                            SET status = 'expired',
                                submitted_at = ?
                            WHERE id = ?
                            """,
                            (
                                get_current_time().isoformat(),
                                existing_attempt["id"]
                            )
                        )

                        return api_response(
                            False,
                            "Exam time has expired"
                        ), 409

                    return api_response(
                        True,
                        "Exam already started",
                        {
                            "attempt_id": existing_attempt["id"],
                            "started_at": existing_attempt["started_at"],
                            "duration_minutes": exam["duration_minutes"]
                        }
                    ), 200

                return api_response(
                    False,
                    "You have already submitted or expired this exam"
                ), 409

            cursor = conn.execute(
                """
                INSERT INTO attempts (
                    user_id,
                    exam_id,
                    status
                )
                VALUES (?, ?, 'in_progress')
                """,
                (user_id, exam_id)
            )

            attempt_id = cursor.lastrowid

            attempt = conn.execute(
                """
                SELECT started_at
                FROM attempts
                WHERE id = ?
                """,
                (attempt_id,)
            ).fetchone()

        return api_response(
            True,
            "Exam started successfully",
            {
                "attempt_id": attempt_id,
                "exam_id": exam_id,
                "exam_title": exam["title"],
                "started_at": attempt["started_at"],
                "duration_minutes": exam["duration_minutes"]
            }
        ), 201

    except (sqlite3.Error, ValueError):
        return api_response(
            False,
            "Unable to start examination"
        ), 500


# --------------------------------------------------
# 8. SUBMIT EXAMINATION AND CALCULATE SCORE API
# --------------------------------------------------

@app.route(
    "/api/attempts/<int:attempt_id>/submit",
    methods=["POST"]
)
def submit_exam(attempt_id):

    user = get_logged_in_user()

    if not user:
        return api_response(
            False,
            "Invalid or missing authentication token"
        ), 401

    if user.get("role") != "student":
        return api_response(
            False,
            "Only students can submit examinations"
        ), 403

    user_id = user.get("user_id")

    if user_id is None:
        return api_response(
            False,
            "Invalid user token"
        ), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return api_response(
            False,
            "Invalid request data"
        ), 400

    answers = data.get("answers")

    if not isinstance(answers, dict):
        return api_response(
            False,
            "Answers must be provided as an object"
        ), 400

    # Validate submitted answers
    for question_id, selected_option in answers.items():

        if not str(question_id).isdigit():
            return api_response(
                False,
                "Invalid question ID"
            ), 400

        if not isinstance(selected_option, str):
            return api_response(
                False,
                "Invalid answer option"
            ), 400

        if selected_option not in ["A", "B", "C", "D"]:
            return api_response(
                False,
                "Invalid answer option"
            ), 400

    try:
        with connection(DATABASE_PATH) as conn:

            attempt = conn.execute(
                """
                SELECT a.id, a.exam_id, a.started_at, a.status,
                       e.duration_minutes
                FROM attempts a
                JOIN exams e ON a.exam_id = e.id
                WHERE a.id = ? AND a.user_id = ?
                """,
                (attempt_id, user_id)
            ).fetchone()

            if attempt is None:
                return api_response(
                    False,
                    "Exam attempt not found"
                ), 404

            if attempt["status"] != "in_progress":
                return api_response(
                    False,
                    "Exam has already been submitted or expired"
                ), 409

            start_time = datetime.fromisoformat(
                attempt["started_at"].replace("Z", "+00:00")
            )

            current_time = get_current_time()

            elapsed_seconds = (
                current_time - start_time
            ).total_seconds()

            time_limit = attempt["duration_minutes"] * 60

            if elapsed_seconds >= time_limit:

                conn.execute(
                    """
                    UPDATE attempts
                    SET status = 'expired',
                        submitted_at = ?
                    WHERE id = ?
                    """,
                    (current_time.isoformat(), attempt_id)
                )

                return api_response(
                    False,
                    "Exam time has expired"
                ), 409

            questions = conn.execute(
                """
                SELECT id, correct_option, marks
                FROM questions
                WHERE exam_id = ?
                ORDER BY id
                """,
                (attempt["exam_id"],)
            ).fetchall()

            valid_question_ids = {
                str(question["id"])
                for question in questions
            }

            if not set(answers.keys()).issubset(valid_question_ids):
                return api_response(
                    False,
                    "Invalid question ID for this examination"
                ), 400

            total_marks = sum(
                question["marks"] for question in questions
            )

            score = 0

            # Save all questions, including unanswered questions
            for question in questions:

                question_id = str(question["id"])
                selected_option = answers.get(question_id)

                if selected_option == question["correct_option"]:
                    score += question["marks"]

                conn.execute(
                    """
                    INSERT INTO answers (
                        attempt_id,
                        question_id,
                        selected_option
                    )
                    VALUES (?, ?, ?)
                    """,
                    (
                        attempt_id,
                        question["id"],
                        selected_option
                    )
                )

            conn.execute(
                """
                UPDATE attempts
                SET status = 'submitted',
                    submitted_at = ?
                WHERE id = ?
                """,
                (current_time.isoformat(), attempt_id)
            )

        return api_response(
            True,
            "Exam submitted successfully",
            {
                "attempt_id": attempt_id,
                "score": score,
                "total_marks": total_marks,
                "status_of_attempt": "submitted"
            }
        ), 200

    except (sqlite3.Error, ValueError):
        return api_response(
            False,
            "Unable to submit examination"
        ), 500


# --------------------------------------------------
# 9. GET EXAMINATION RESULT API
# --------------------------------------------------

@app.route(
    "/api/attempts/<int:attempt_id>/result",
    methods=["GET"]
)
def get_result(attempt_id):

    user = get_logged_in_user()

    if not user:
        return api_response(
            False,
            "Invalid or missing authentication token"
        ), 401

    if user.get("role") != "student":
        return api_response(
            False,
            "Only students can view examination results"
        ), 403

    user_id = user.get("user_id")

    if user_id is None:
        return api_response(
            False,
            "Invalid user token"
        ), 401

    try:
        with connection(DATABASE_PATH) as conn:

            attempt = conn.execute(
                """
                SELECT a.id, a.exam_id, a.status,
                       e.title AS exam_title
                FROM attempts a
                JOIN exams e ON a.exam_id = e.id
                WHERE a.id = ? AND a.user_id = ?
                """,
                (attempt_id, user_id)
            ).fetchone()

            if attempt is None:
                return api_response(
                    False,
                    "Exam attempt not found"
                ), 404

            if attempt["status"] != "submitted":
                return api_response(
                    False,
                    "Result is not available yet"
                ), 409

            result = conn.execute(
                """
                SELECT
                    COALESCE(SUM(
                        CASE
                            WHEN ans.selected_option = q.correct_option
                            THEN q.marks
                            ELSE 0
                        END
                    ), 0) AS score,
                    COALESCE(SUM(q.marks), 0) AS total_marks
                FROM questions q
                LEFT JOIN answers ans
                    ON ans.question_id = q.id
                    AND ans.attempt_id = ?
                WHERE q.exam_id = ?
                """,
                (attempt_id, attempt["exam_id"])
            ).fetchone()

        return api_response(
            True,
            "Examination result fetched successfully",
            {
                "exam_title": attempt["exam_title"],
                "attempt_id": attempt_id,
                "score": result["score"],
                "total_marks": result["total_marks"],
                "status_of_attempt": attempt["status"]
            }
        ), 200

    except sqlite3.Error:
        return api_response(
            False,
            "Unable to fetch examination result"
        ), 500


# --------------------------------------------------
# RUN FLASK SERVER
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
