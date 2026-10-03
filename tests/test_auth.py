import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import get_password_hash, verify_password, create_access_token, decode_access_token

client = TestClient(app)


def test_password_hashing():
    pwd = "secretBudget123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_jwt_token_flow():
    payload = {"sub": "42", "email": "test@pocketsmart.ai"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["email"] == "test@pocketsmart.ai"


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "PocketSmart AI"


def test_landing_page_renders():
    response = client.get("/")
    assert response.status_code == 200
    assert "PocketSmart" in response.text
    assert "Home Interior Planner" in response.text


import uuid


def test_registration_and_login_api_flow():
    # 1. Register a new user with unique email
    unique_email = f"tester_{uuid.uuid4().hex[:8]}@pocketsmart.ai"
    user_payload = {
        "name": "Integration User",
        "email": unique_email,
        "password": "strongPassword99!"
    }
    reg_response = client.post("/register", json=user_payload, headers={"Accept": "application/json"})
    assert reg_response.status_code == 200, reg_response.text
    reg_data = reg_response.json()
    assert reg_data["email"] == user_payload["email"]
    assert "id" in reg_data

    # 2. Login with credentials
    login_response = client.post(
        "/login",
        json={"email": user_payload["email"], "password": user_payload["password"]},
        headers={"Accept": "application/json"}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 3. Access session-info with Bearer token
    session_response = client.get("/session-info", headers={"Authorization": f"Bearer {token}"})
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data["is_authenticated"] is True
    assert session_data["user"]["email"] == user_payload["email"]

    # 4. Attempt login with wrong password
    bad_login = client.post(
        "/login",
        json={"email": user_payload["email"], "password": "wrongPassword"},
        headers={"Accept": "application/json"}
    )
    assert bad_login.status_code == 401

