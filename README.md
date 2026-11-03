# Online Examination System — Member 3 module

This workspace contains the database and admin module. The Member 2 Flask application and student frontend are not present here, so this package does not create an application entry point.

## Setup

Use Python 3.10 or newer. From the project root:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
$env:DATABASE_PATH = (Join-Path (Get-Location) 'database\online_exam.db')
py -c "from database.db import init_db; print(init_db())"
py -m database.seed
```

The demo accounts are `admin@example.test` / `DemoAdmin123!` and `student@example.test` / `DemoStudent123!`. They are local demonstration credentials only. Set `DEMO_ADMIN_PASSWORD` and `DEMO_STUDENT_PASSWORD` before seeding to choose local passwords. Seeding is repeatable and does not overwrite existing account passwords. Do not use demo credentials in a deployed system.

## Database API

`database.db.get_connection(path=None)` returns a `sqlite3.Connection` with named row access and foreign-key enforcement. Callers own and must close it. `database.db.connection(path=None)` is a context manager that commits on success, rolls back on exceptions, and closes the connection. `init_db(path=None)` creates schema idempotently. Both `DATABASE_PATH` and an explicit `path` are supported; the default is `database/online_exam.db` independent of the working directory. Flask callers can use `get_db()` and register `close_db` with `app.teardown_appcontext`.

## Member 2 integration

In the existing application factory or setup, set the same DB path and register the blueprint:

```python
from admin.routes import admin_bp
from database.db import close_db, init_db

app.config["DATABASE_PATH"] = configured_database_path
init_db(app.config["DATABASE_PATH"])
app.teardown_appcontext(close_db)
app.register_blueprint(admin_bp)
```

The admin API expects the authenticated Flask session to contain `user_id`; it verifies that ID and its `role` against the `users` table on every request. Member 2's login must normalize emails with `.strip().lower()`, store passwords using Werkzeug hashes, and set `session['user_id']` after successful authentication. It must not trust a browser-supplied role. Admin routes use `/api/admin`. The page is `frontend/admin.html`; serve it through the existing app (for example, `send_from_directory`) and provide the app's existing `POST /logout` and `/login` routes because the module does not own those routes.

Store selected student answers in `answers` with an attempt status of `submitted` or `expired` when scoring/reporting should include them. Reports compute score from immutable persisted choices and current answer keys. Deletion of a question referenced by an answer returns 409; exam deletion is intentionally not exposed. The existing student question API must explicitly select public question fields and omit `correct_option`.

## Admin endpoints

- `GET /api/admin/dashboard`
- `GET, POST /api/admin/exams`
- `PUT /api/admin/exams/<id>`
- `GET /api/admin/exams/<id>/questions`
- `POST /api/admin/exams/<id>/questions`
- `PUT, DELETE /api/admin/questions/<id>`
- `GET /api/admin/results`

Errors use `{"error":{"code":"...","message":"..."}}`. Results include submitted and expired attempts, calculate marks on the server, and never return password hashes.

## Run the existing app and tests

Once Member 2's `backend/app.py` is available and registers `admin_bp`, run that existing entry point (for example `py backend/app.py`, if that is how it is configured). This module deliberately does not introduce another Flask application. Run module tests from the root with `py -m pytest`.
