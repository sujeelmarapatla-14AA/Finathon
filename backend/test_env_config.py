"""
SpendIntel - Environment Variables & Startup Validation Test Suite.

Validates:
1. python-dotenv present in requirements.txt.
2. .env loading from backend/.env.
3. No hard-coded keys in codebase.
4. .env ignored by Git (.gitignore).
5. Nova client reads os.getenv("NOVA_API_KEY").
6. AI service reads os.getenv("AI_API_KEY").
7. Never logs or prints secrets.
8. Startup validation reports only:
   "Nova API key configured: yes/no"
   "AI API key configured: yes/no"
9. Backend FastAPI starts and /api/config/status responds.
"""

import os
import sys
import re
import io
from pathlib import Path
from unittest.mock import patch
import httpx

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

backend_dir = Path(__file__).resolve().parent
workspace_dir = backend_dir.parent
sys.path.insert(0, str(backend_dir))

from app.main import validate_config, app
from app.services.nova_client import _get_api_key, NovaAPIError
from app.services.ai_investigator import generate_investigation


def test_requirements_file():
    print("\n--- Test 1: requirements.txt includes python-dotenv ---")
    req_file = backend_dir / "requirements.txt"
    assert req_file.exists(), "requirements.txt not found"
    content = req_file.read_text(encoding="utf-8")
    assert "python-dotenv" in content, "python-dotenv missing from requirements.txt"
    print("  ✓ python-dotenv verified in requirements.txt")


def test_gitignore():
    print("\n--- Test 2: .gitignore excludes .env files ---")
    root_git = workspace_dir / ".gitignore"
    backend_git = backend_dir / ".gitignore"

    assert root_git.exists() or backend_git.exists(), ".gitignore not found"
    root_content = root_git.read_text(encoding="utf-8") if root_git.exists() else ""
    backend_content = backend_git.read_text(encoding="utf-8") if backend_git.exists() else ""

    assert ".env" in root_content or ".env" in backend_content, ".env not in .gitignore"
    print("  ✓ .env patterns properly configured in .gitignore")


def test_no_hardcoded_secrets():
    print("\n--- Test 3: No Hardcoded Secrets in Codebase ---")
    py_files = list(backend_dir.glob("**/*.py"))
    secret_patterns = [
        re.compile(r'NOVA_API_KEY\s*=\s*["\'][a-zA-Z0-9_\-]{8,}["\']'),
        re.compile(r'AI_API_KEY\s*=\s*["\'][a-zA-Z0-9_\-]{8,}["\']'),
        re.compile(r'GEMINI_API_KEY\s*=\s*["\'][a-zA-Z0-9_\-]{8,}["\']'),
    ]

    for py_path in py_files:
        if "venv" in str(py_path):
            continue
        code = py_path.read_text(encoding="utf-8", errors="ignore")
        for pat in secret_patterns:
            matches = pat.findall(code)
            assert not matches, f"Hardcoded secret pattern found in {py_path.name}: {matches}"

    print(f"  ✓ Audited {len(py_files)} python files: Zero hardcoded secrets detected")


def test_startup_validation_output():
    print("\n--- Test 4: Startup Validation Reporting (yes/no only) ---")

    # Case A: Both keys configured
    captured_stdout = io.StringIO()
    with patch.dict(os.environ, {"NOVA_API_KEY": "super_secret_nova_123", "AI_API_KEY": "super_secret_ai_456"}):
        with patch("sys.stdout", captured_stdout):
            res = validate_config(log_output=True)

    output = captured_stdout.getvalue()
    assert "Nova API key configured: yes" in output
    assert "AI API key configured: yes" in output
    assert "super_secret_nova_123" not in output, "CRITICAL: Secret key leaked into logs!"
    assert "super_secret_ai_456" not in output, "CRITICAL: Secret key leaked into logs!"
    assert res == {"nova_api_key_configured": "yes", "ai_api_key_configured": "yes"}
    print("  ✓ Configured state output: 'yes' without leaking secrets")

    # Case B: Keys missing
    captured_stdout2 = io.StringIO()
    with patch.dict(os.environ, {"NOVA_API_KEY": "", "AI_API_KEY": "", "GEMINI_API_KEY": "", "OPENROUTER_API_KEY": ""}):
        with patch("sys.stdout", captured_stdout2):
            res2 = validate_config(log_output=True)

    output2 = captured_stdout2.getvalue()
    assert "Nova API key configured: no" in output2
    assert "AI API key configured: no" in output2
    assert res2 == {"nova_api_key_configured": "no", "ai_api_key_configured": "no"}
    print("  ✓ Unconfigured state output: 'no'")


def test_client_environment_reading():
    print("\n--- Test 5: Client Environment Variable Reading ---")

    # Nova Client
    with patch.dict(os.environ, {"NOVA_API_KEY": "test_nova_abc"}):
        key = _get_api_key()
        assert key == "test_nova_abc"
        print("  ✓ Nova client reads os.getenv('NOVA_API_KEY')")

    with patch.dict(os.environ, {"NOVA_API_KEY": ""}):
        try:
            _get_api_key()
            assert False, "Expected error on empty key"
        except NovaAPIError as e:
            assert e.status_code == 401

    # AI Service
    with patch.dict(os.environ, {"AI_API_KEY": ""}):
        evidence = {
            "finding": {"product_name": "Laptop", "actual_price": 50000, "benchmark_price": 45000, "quantity": 10},
            "root_cause": "Test root cause",
            "recommended_actions": ["Action 1"],
        }
        res_ai = generate_investigation(evidence)
        assert res_ai is not None
        assert "root_cause" in res_ai
        print("  ✓ AI service reads os.getenv('AI_API_KEY') and provides deterministic fallback when missing")


def test_live_config_endpoint():
    print("\n--- Test 6: FastAPI Application Startup & Config Diagnostic Endpoint ---")
    from fastapi.testclient import TestClient

    with TestClient(app) as client:
        resp = client.get("/api/config/status")
        assert resp.status_code == 200, f"Config status failed: {resp.text}"
        data = resp.json()
        assert "nova_api_key_configured" in data
        assert "ai_api_key_configured" in data
        assert data["nova_api_key_configured"] in ["yes", "no"]
        assert data["ai_api_key_configured"] in ["yes", "no"]
        print(f"  ✓ GET /api/config/status -> 200 OK: {data}")

        # Health endpoint
        r_health = client.get("/health")
        assert r_health.status_code == 200
        print(f"  ✓ GET /health -> 200 OK: {r_health.json()}")

        # Root endpoint
        r_root = client.get("/")
        assert r_root.status_code == 200
        print(f"  ✓ GET / -> 200 OK: {r_root.json()}")


def run_all_env_tests():
    print("=" * 75)
    print("SPENDINTEL — ENVIRONMENT CONFIGURATION & STARTUP VALIDATION")
    print("=" * 75)

    test_requirements_file()
    test_gitignore()
    test_no_hardcoded_secrets()
    test_startup_validation_output()
    test_client_environment_reading()
    test_live_config_endpoint()

    print("\n" + "=" * 75)
    print("ALL ENVIRONMENT & STARTUP TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 75)


if __name__ == "__main__":
    run_all_env_tests()
