import pytest
from flask import Flask, session

from admin.routes import admin_bp
from database.db import get_connection, init_db
from werkzeug.security import generate_password_hash


@pytest.fixture
def app(tmp_path):
    path = tmp_path / "app.db"
    init_db(path)
    conn = get_connection(path)
    conn.executemany("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)", [
        ("Admin", "admin@test", generate_password_hash("secret"), "admin"),
        ("Student", "student@test", generate_password_hash("secret"), "student"),
    ])
    conn.commit(); conn.close()
    application = Flask(__name__)
    application.secret_key = "test-only-secret"
    application.config["DATABASE_PATH"] = str(path)
    application.register_blueprint(admin_bp)
    @application.post("/test-login/<int:user_id>")
    def login(user_id):
        session["user_id"] = user_id
        return "ok"
    return application


@pytest.fixture
def client(app):
    return app.test_client()


def login(client, uid):
    client.post(f"/test-login/{uid}")


def test_authorization(client):
    assert client.get("/api/admin/dashboard").status_code == 401
    login(client, 2)
    assert client.get("/api/admin/dashboard").status_code == 403
    login(client, 1)
    assert client.get("/api/admin/dashboard").status_code == 200


def test_exam_question_management_validation_and_safe_delete(client, app):
    login(client, 1)
    assert client.post("/api/admin/exams", json={"title":"bad", "duration_minutes":0}).status_code == 400
    created = client.post("/api/admin/exams", json={"title":" Exam ","duration_minutes":30}).get_json()["exam"]
    assert created["title"] == "Exam"
    eid = created["id"]
    payload = {"question_text":"Q?", "option_a":"a", "option_b":"b", "option_c":"c", "option_d":"d", "correct_option":"B", "marks":2}
    assert client.post(f"/api/admin/exams/{eid}/questions", json={**payload,"correct_option":"X"}).status_code == 400
    q = client.post(f"/api/admin/exams/{eid}/questions", json=payload).get_json()["question"]
    assert "password_hash" not in q
    assert client.put("/api/admin/exams/987", json={"title":"missing"}).status_code == 404
    conn = get_connection(app.config["DATABASE_PATH"])
    conn.execute("INSERT INTO attempts(user_id,exam_id,status) VALUES(2,?,'submitted')", (eid,))
    aid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.execute("INSERT INTO answers(attempt_id,question_id,selected_option) VALUES(?,?,?)", (aid,q["id"],"B"))
    conn.commit(); conn.close()
    assert client.delete(f"/api/admin/questions/{q['id']}").status_code == 409


def test_reports_scores_and_omit_password_hash(client, app):
    login(client, 1)
    exam = client.post("/api/admin/exams", json={"title":"Report", "duration_minutes":10}).get_json()["exam"]
    question = client.post(f"/api/admin/exams/{exam['id']}/questions", json={"question_text":"Q", "option_a":"A", "option_b":"B", "option_c":"C", "option_d":"D", "correct_option":"C", "marks":3}).get_json()["question"]
    conn = get_connection(app.config["DATABASE_PATH"])
    conn.execute("INSERT INTO attempts(user_id,exam_id,status) VALUES(2,?,'submitted')",(exam["id"],))
    aid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.execute("INSERT INTO answers(attempt_id,question_id,selected_option) VALUES(?,?,?)",(aid,question["id"],"C"))
    conn.commit();conn.close()
    report = client.get("/api/admin/results").get_json()["results"][0]
    assert report["score"] == 3 and report["total_marks"] == 3
    assert "password_hash" not in str(client.get("/api/admin/results").get_json())
    assert client.get("/api/admin/dashboard").get_json()["summary"]["submitted_attempts"] == 1
