"""
Shared fixtures for DoHub functional tests.
Provides session management, auth setup, and health checks.
"""
import os
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"

# Fixed credentials for reproducibility across runs
ADMIN_EMAIL = "ftadmin@dohub.test"
ADMIN_PASSWORD = "FtTestPassword123!"


@pytest.fixture(scope="session", autouse=True)
def health_check():
    """Confirm the app is reachable before running any tests."""
    resp = requests.get(f"{BASE_URL}/api/auth", timeout=10)
    assert resp.status_code == 200, f"App not healthy: {resp.status_code} {resp.text}"


@pytest.fixture(scope="session")
def admin_session():
    """
    Set up admin account and return an authenticated requests.Session.
    Uses fixed credentials so tests are idempotent across reruns.
    If admin already exists, logs in with known credentials.
    """
    session = requests.Session()

    # Check if setup is required
    resp = session.get(f"{BASE_URL}/api/auth", timeout=10)
    setup_required = resp.json().get("setupRequired", False)

    if setup_required:
        # Create admin account
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "setup",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        assert resp.status_code == 200, f"Setup failed: {resp.status_code} {resp.text}"
    else:
        # Admin already exists -- try login with our known credentials
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        if resp.status_code != 200:
            # Admin was created by a previous run with different credentials.
            # Delete the DB and restart the app to get a fresh state.
            db_dir = os.environ.get("DOCKER_HUB_DB_DIR", os.path.join(
                os.environ.get("WORKSPACE_DIR", ""), "DoHub", "data"
            ))
            db_path = os.path.join(db_dir, "docker-hub.db")
            for suffix in ("", "-wal", "-shm"):
                p = db_path + suffix
                if os.path.exists(p):
                    os.remove(p)

            # Wait for the app to re-initialize the DB on next request
            import time
            time.sleep(1)

            # Now setup should be required again
            resp = session.get(f"{BASE_URL}/api/auth", timeout=10)
            assert resp.json().get("setupRequired") is True, \
                f"Expected setupRequired=true after DB reset, got: {resp.text}"

            resp = session.post(
                f"{BASE_URL}/api/auth",
                json={
                    "action": "setup",
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD,
                },
                timeout=10,
            )
            assert resp.status_code == 200, f"Setup after reset failed: {resp.status_code} {resp.text}"

    # Verify session cookie is set
    assert "dh_session" in session.cookies, "Session cookie not set after auth"

    yield session

    # No teardown needed - session will expire naturally
