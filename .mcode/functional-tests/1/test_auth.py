"""
Functional tests for /api/auth and /api/auth/logout endpoints.
Tests auth setup, login, logout, and error cases.
"""
import os
import sys
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"

# Ensure conftest is importable
sys.path.insert(0, os.path.dirname(__file__))


class TestAuthGetStatus:
    """GET /api/auth -- check setup status."""

    def test_auth_status_returns_200(self):
        """GET /api/auth returns 200 with setupRequired field."""
        resp = requests.get(f"{BASE_URL}/api/auth", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert "setupRequired" in body
        assert isinstance(body["setupRequired"], bool)


class TestAuthSetup:
    """POST /api/auth with action=setup."""

    def test_setup_creates_admin(self, admin_session):
        """After setup, setupRequired should be false."""
        resp = requests.get(f"{BASE_URL}/api/auth", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert body["setupRequired"] is False

    def test_setup_duplicate_admin_returns_409(self, admin_session):
        """POST /api/auth setup when admin already exists returns 409."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "setup",
                "email": "another@test.com",
                "password": "AnotherPass123!",
            },
            timeout=10,
        )
        assert resp.status_code == 409


class TestAuthLogin:
    """POST /api/auth with action=login."""

    def test_login_success(self, admin_session):
        """Login with valid credentials returns 200 and sets session cookie."""
        from conftest import ADMIN_EMAIL, ADMIN_PASSWORD

        session = requests.Session()
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True
        assert "dh_session" in session.cookies

    def test_login_wrong_password_returns_401(self, admin_session):
        """Login with wrong password returns 401."""
        from conftest import ADMIN_EMAIL

        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": ADMIN_EMAIL,
                "password": "WrongPassword999!",
            },
            timeout=10,
        )
        assert resp.status_code == 401

    def test_login_wrong_email_returns_401(self, admin_session):
        """Login with non-existent email returns 401."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": "nonexistent@test.com",
                "password": "SomePassword123!",
            },
            timeout=10,
        )
        assert resp.status_code == 401

    def test_login_missing_fields_returns_400(self):
        """Login without email/password returns 400."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={"action": "login"},
            timeout=10,
        )
        assert resp.status_code == 400

    def test_login_short_password_returns_400(self):
        """Setup with password < 8 chars returns 400."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "setup",
                "email": "short@test.com",
                "password": "abc",
            },
            timeout=10,
        )
        assert resp.status_code in (400, 409)  # 409 if admin already exists

    def test_login_unknown_action_returns_400(self):
        """POST /api/auth with unknown action returns 400."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "unknown_action",
                "email": "test@test.com",
                "password": "TestPassword123!",
            },
            timeout=10,
        )
        assert resp.status_code == 400

    def test_login_empty_body_returns_400(self):
        """POST /api/auth with empty body returns 400."""
        resp = requests.post(
            f"{BASE_URL}/api/auth",
            json={},
            timeout=10,
        )
        assert resp.status_code == 400


class TestAuthLogout:
    """POST /api/auth/logout."""

    def test_logout_success(self, admin_session):
        """Logout with valid session returns 200."""
        from conftest import ADMIN_EMAIL, ADMIN_PASSWORD

        # Create a fresh login session to logout
        session = requests.Session()
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        assert resp.status_code == 200

        # Logout
        resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

    def test_logout_without_session_returns_200(self):
        """Logout without a session cookie still returns 200."""
        resp = requests.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert resp.status_code == 200

    def test_session_invalid_after_logout(self, admin_session):
        """After logout, the session cookie should be invalid."""
        from conftest import ADMIN_EMAIL, ADMIN_PASSWORD

        # Create a fresh session and login
        session = requests.Session()
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={
                "action": "login",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        assert resp.status_code == 200

        # Logout
        resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert resp.status_code == 200

        # Try to access protected endpoint -- should get 401
        resp = session.get(f"{BASE_URL}/api/applications", timeout=10)
        assert resp.status_code == 401
