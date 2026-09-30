import sys
from pathlib import Path
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app

client = TestClient(app)


def test_auth_full_suite():
    print("\n--- [1] SEED USER LOGIN ---")
    login_res = client.post("/api/auth/login", json={
        "email": "analyst@company.com",
        "password": "AnalystPassword123!"
    })
    assert login_res.status_code == 200, f"Failed: {login_res.text}"
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == "analyst@company.com"
    assert login_data["user"]["role"] == "procurement_analyst"
    token = login_data["access_token"]
    print("[PASS] Seed analyst login successful. JWT token received.")

    print("\n--- [2] GET /api/auth/me WITH VALID TOKEN ---")
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "analyst@company.com"
    assert me_data["is_active"] is True
    print(f"[PASS] Current user retrieved: {me_data['name']} ({me_data['role']})")

    print("\n--- [3] GET /api/auth/me WITHOUT / INVALID TOKEN ---")
    me_fail = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_123"})
    assert me_fail.status_code == 401
    print("[PASS] Invalid token rejected with 401.")

    print("\n--- [4] UNAUTHORIZED EMAIL SIGNUP (GMAIL REJECTION) ---")
    bad_email_res = client.post("/api/auth/signup", json={
        "name": "External Hacker",
        "email": "hacker@gmail.com",
        "password": "Password123!"
    })
    assert bad_email_res.status_code == 403, f"Expected 403, got {bad_email_res.status_code}"
    print("[PASS] Unauthorized email domain correctly rejected with 403.")

    print("\n--- [5] SHORT PASSWORD REJECTION ---")
    weak_pw_res = client.post("/api/auth/signup", json={
        "name": "Jane Doe",
        "email": "jane.doe@company.com",
        "password": "short"
    })
    assert weak_pw_res.status_code in [400, 422]
    print("[PASS] Password shorter than 8 characters rejected.")

    print("\n--- [6] VALID SIGNUP WITH AUTHORIZED COMPANY EMAIL ---")
    import uuid
    new_email = f"sarah.connor.{uuid.uuid4().hex[:6]}@company.com"
    signup_res = client.post("/api/auth/signup", json={
        "name": "Sarah Connor",
        "email": new_email,
        "password": "Cyberdyne2026!#"
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    assert signup_res.json()["success"] is True
    print("[PASS] New company user registered successfully.")

    print("\n--- [7] DUPLICATE EMAIL SIGNUP REJECTION ---")
    dup_res = client.post("/api/auth/signup", json={
        "name": "Sarah Connor Clone",
        "email": new_email,
        "password": "Cyberdyne2026!#"
    })
    assert dup_res.status_code == 409
    print("[PASS] Duplicate email registration rejected with 409 Conflict.")

    print("\n--- [8] LOGIN WITH NEWLY CREATED ACCOUNT ---")
    new_login_res = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "Cyberdyne2026!#"
    })
    assert new_login_res.status_code == 200
    new_token = new_login_res.json()["access_token"]
    assert new_login_res.json()["user"]["role"] == "procurement_analyst"
    print("[PASS] Newly created account logged in successfully.")

    print("\n--- [9] INVALID PASSWORD LOGIN ---")
    bad_pw_login = client.post("/api/auth/login", json={
        "email": new_email,
        "password": "WrongPassword999!"
    })
    assert bad_pw_login.status_code == 401
    print("[PASS] Incorrect password rejected with 401.")

    print("\n--- [10] COMPILEALL BACKEND/APP ---")
    import compileall
    compile_ok = compileall.compile_dir(str(BASE_DIR / "app"), force=True, quiet=1)
    assert compile_ok, "Python compilation failed on backend/app"
    print("[PASS] backend/app compiled cleanly.")

    print("\n==========================================")
    print("ALL AUTHENTICATION TESTS PASSED 100%!")
    print("==========================================")


if __name__ == "__main__":
    test_auth_full_suite()
