
import jwt
import datetime
import os

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret-change-before-deployment"
)


# Convert plain password into a secure hash
def hash_password(password):
    return generate_password_hash(password)


# Verify entered password against stored hash
def check_password(password, hashed_password):
    return check_password_hash(hashed_password, password)


# Generate JWT token after successful login
def generate_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(hours=2)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm="HS256"
    )


# Verify JWT token
def verify_token(token):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )
    except jwt.InvalidTokenError:
        return None
