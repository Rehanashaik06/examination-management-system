"""Admin API authenticated by the main application's JWT cookie."""
from functools import wraps
import sqlite3

from flask import Blueprint, current_app, g, jsonify, request

from backend.auth import verify_token
from database.db import get_connection

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _error(code, message, status):
    return jsonify({"error": {"code": code, "message": message}}), status


def _conn():
    return get_connection(current_app.config.get("DATABASE_PATH"))


def admin_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        token = request.cookies.get("access_token")
        claims = verify_token(token) if token else None
        uid = claims.get("user_id") if claims else None
        if not isinstance(uid, int) or isinstance(uid, bool):
            return _error("UNAUTHENTICATED", "Authentication required", 401)
        conn = _conn()
        try:
            user = conn.execute("SELECT id, role FROM users WHERE id=?", (uid,)).fetchone()
        finally:
            conn.close()
        if not user:
            return _error("UNAUTHENTICATED", "Authentication required", 401)
        if user["role"] != "admin":
            return _error("FORBIDDEN", "Administrator access required", 403)
        g.admin_user_id = user["id"]
        return fn(*args, **kwargs)
    return wrapped


def _body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def _positive_int(value):
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _exam_payload(data, partial=False):
    fields = {}
    if not partial or "title" in data:
        title = data.get("title")
        if not isinstance(title, str) or not title.strip(): return None, "title is required"
        fields["title"] = title.strip()
    if not partial or "description" in data:
        description = data.get("description", "")
        if description is not None and not isinstance(description, str): return None, "description must be text"
        fields["description"] = description.strip() if description else None
    if not partial or "duration_minutes" in data:
        duration = data.get("duration_minutes")
        if not _positive_int(duration): return None, "duration_minutes must be a positive integer"
        fields["duration_minutes"] = duration
    if not partial or "is_published" in data:
        published = data.get("is_published", False)
        if not isinstance(published, bool): return None, "is_published must be a boolean"
        fields["is_published"] = int(published)
    return fields, None


def _question_payload(data):
    fields = {}
    for key in ("question_text", "option_a", "option_b", "option_c", "option_d"):
        value = data.get(key)
        if not isinstance(value, str) or not value.strip(): return None, f"{key} is required"
        fields[key] = value.strip()
    correct = data.get("correct_option")
    if not isinstance(correct, str) or correct.upper() not in ("A", "B", "C", "D"):
        return None, "correct_option must be A, B, C, or D"
    fields["correct_option"] = correct.upper()
    marks = data.get("marks", 1)
    if not _positive_int(marks): return None, "marks must be a positive integer"
    fields["marks"] = marks
    return fields, None


@admin_bp.get("/dashboard")
@admin_required
def dashboard():
    conn = _conn()
    try:
        row = conn.execute("SELECT (SELECT COUNT(*) FROM exams) total_exams, (SELECT COUNT(*) FROM exams WHERE is_published=1) published_exams, (SELECT COUNT(*) FROM users WHERE role='student') total_students, (SELECT COUNT(*) FROM attempts WHERE status='submitted') submitted_attempts").fetchone()
        return jsonify({"summary": dict(row)})
    finally: conn.close()


@admin_bp.get("/exams")
@admin_required
def list_exams():
    conn = _conn()
    try:
        rows = conn.execute("SELECT e.id,e.title,e.description,e.duration_minutes,e.is_published,e.created_at,COUNT(q.id) question_count FROM exams e LEFT JOIN questions q ON q.exam_id=e.id GROUP BY e.id ORDER BY e.id DESC").fetchall()
        return jsonify({"exams": [dict(r) for r in rows]})
    finally: conn.close()


@admin_bp.post("/exams")
@admin_required
def create_exam():
    data = _body()
    if data is None: return _error("VALIDATION_ERROR", "A JSON object is required", 400)
    fields, err = _exam_payload(data)
    if err: return _error("VALIDATION_ERROR", err, 400)
    conn = _conn()
    try:
        cur = conn.execute("INSERT INTO exams(title,description,duration_minutes,is_published,created_by) VALUES(?,?,?,?,?)", (fields["title"], fields["description"], fields["duration_minutes"], fields["is_published"], g.admin_user_id))
        conn.commit()
        row = conn.execute("SELECT id,title,description,duration_minutes,is_published,created_at FROM exams WHERE id=?", (cur.lastrowid,)).fetchone()
        return jsonify({"exam": dict(row)}), 201
    except sqlite3.Error:
        conn.rollback(); current_app.logger.exception("Failed to create exam")
        return _error("DATABASE_ERROR", "Unable to create exam", 500)
    finally: conn.close()


@admin_bp.put("/exams/<int:exam_id>")
@admin_required
def update_exam(exam_id):
    data = _body()
    if data is None: return _error("VALIDATION_ERROR", "A JSON object is required", 400)
    fields, err = _exam_payload(data, partial=True)
    if err: return _error("VALIDATION_ERROR", err, 400)
    if not fields: return _error("VALIDATION_ERROR", "At least one field is required", 400)
    conn = _conn()
    try:
        if not conn.execute("SELECT 1 FROM exams WHERE id=?", (exam_id,)).fetchone(): return _error("NOT_FOUND", "Exam not found", 404)
        assignments = ",".join(f"{key}=?" for key in fields)
        conn.execute(f"UPDATE exams SET {assignments} WHERE id=?", (*fields.values(), exam_id))
        conn.commit()
        row = conn.execute("SELECT id,title,description,duration_minutes,is_published,created_at FROM exams WHERE id=?", (exam_id,)).fetchone()
        return jsonify({"exam": dict(row)})
    except sqlite3.Error:
        conn.rollback(); current_app.logger.exception("Failed to update exam")
        return _error("DATABASE_ERROR", "Unable to update exam", 500)
    finally: conn.close()


@admin_bp.post("/exams/<int:exam_id>/questions")
@admin_required
def create_question(exam_id):
    data = _body()
    if data is None: return _error("VALIDATION_ERROR", "A JSON object is required", 400)
    fields, err = _question_payload(data)
    if err: return _error("VALIDATION_ERROR", err, 400)
    conn = _conn()
    try:
        if not conn.execute("SELECT 1 FROM exams WHERE id=?", (exam_id,)).fetchone(): return _error("NOT_FOUND", "Exam not found", 404)
        cur = conn.execute("INSERT INTO questions(exam_id,question_text,option_a,option_b,option_c,option_d,correct_option,marks) VALUES(?,?,?,?,?,?,?,?)", (exam_id, *(fields[k] for k in ("question_text","option_a","option_b","option_c","option_d","correct_option","marks"))))
        conn.commit()
        row = conn.execute("SELECT * FROM questions WHERE id=?", (cur.lastrowid,)).fetchone()
        return jsonify({"question": dict(row)}), 201
    except sqlite3.Error:
        conn.rollback(); current_app.logger.exception("Failed to create question")
        return _error("DATABASE_ERROR", "Unable to create question", 500)
    finally: conn.close()


@admin_bp.put("/questions/<int:question_id>")
@admin_required
def update_question(question_id):
    data = _body()
    if data is None: return _error("VALIDATION_ERROR", "A JSON object is required", 400)
    fields, err = _question_payload(data)
    if err: return _error("VALIDATION_ERROR", err, 400)
    conn = _conn()
    try:
        if not conn.execute("SELECT 1 FROM questions WHERE id=?", (question_id,)).fetchone(): return _error("NOT_FOUND", "Question not found", 404)
        conn.execute("UPDATE questions SET question_text=?,option_a=?,option_b=?,option_c=?,option_d=?,correct_option=?,marks=? WHERE id=?", (*(fields[k] for k in ("question_text","option_a","option_b","option_c","option_d","correct_option","marks")), question_id))
        conn.commit()
        row = conn.execute("SELECT * FROM questions WHERE id=?", (question_id,)).fetchone()
        return jsonify({"question": dict(row)})
    except sqlite3.Error:
        conn.rollback(); current_app.logger.exception("Failed to update question")
        return _error("DATABASE_ERROR", "Unable to update question", 500)
    finally: conn.close()


@admin_bp.delete("/questions/<int:question_id>")
@admin_required
def delete_question(question_id):
    conn = _conn()
    try:
        question = conn.execute("SELECT exam_id FROM questions WHERE id=?", (question_id,)).fetchone()
        if not question: return _error("NOT_FOUND", "Question not found", 404)
        if conn.execute("SELECT 1 FROM answers WHERE question_id=? LIMIT 1", (question_id,)).fetchone() or conn.execute("SELECT 1 FROM attempts WHERE exam_id=? LIMIT 1", (question["exam_id"],)).fetchone():
            return _error("CONFLICT", "Question belongs to an exam with historical attempts and cannot be deleted", 409)
        conn.execute("DELETE FROM questions WHERE id=?", (question_id,)); conn.commit()
        return jsonify({"deleted": True})
    except sqlite3.Error:
        conn.rollback(); current_app.logger.exception("Failed to delete question")
        return _error("DATABASE_ERROR", "Unable to delete question", 500)
    finally: conn.close()


@admin_bp.get("/exams/<int:exam_id>/questions")
@admin_required
def list_questions(exam_id):
    conn = _conn()
    try:
        if not conn.execute("SELECT 1 FROM exams WHERE id=?", (exam_id,)).fetchone(): return _error("NOT_FOUND", "Exam not found", 404)
        rows = conn.execute("SELECT * FROM questions WHERE exam_id=? ORDER BY id", (exam_id,)).fetchall()
        return jsonify({"questions": [dict(r) for r in rows]})
    finally: conn.close()


@admin_bp.get("/results")
@admin_required
def results():
    conn = _conn()
    try:
        rows = conn.execute("SELECT a.id attempt_id,u.id student_id,u.name student_name,e.id exam_id,e.title exam_title,a.status,a.started_at,a.submitted_at,COALESCE(SUM(CASE WHEN ans.selected_option=q.correct_option THEN q.marks ELSE 0 END),0) score,COALESCE(SUM(q.marks),0) total_marks FROM attempts a JOIN users u ON u.id=a.user_id JOIN exams e ON e.id=a.exam_id LEFT JOIN questions q ON q.exam_id=e.id LEFT JOIN answers ans ON ans.attempt_id=a.id AND ans.question_id=q.id WHERE a.status IN ('submitted','expired') GROUP BY a.id ORDER BY a.id DESC").fetchall()
        return jsonify({"results": [dict(r) for r in rows]})
    finally: conn.close()
