"""
Functional tests for /api/settings endpoints.
Tests GET/PUT settings operations including the updateSettings bug fix.
"""
import os
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"


class TestSettingsUnauthorized:
    """Verify settings endpoints require auth."""

    def test_get_settings_unauthorized(self):
        """GET /api/settings without auth returns 401."""
        resp = requests.get(f"{BASE_URL}/api/settings", timeout=10)
        assert resp.status_code == 401

    def test_put_settings_unauthorized(self):
        """PUT /api/settings without auth returns 401."""
        resp = requests.put(
            f"{BASE_URL}/api/settings",
            json={"monitoring_interval_seconds": 300},
            timeout=10,
        )
        assert resp.status_code == 401


class TestGetSettings:
    """GET /api/settings -- retrieve current settings."""

    def test_get_settings_returns_200(self, admin_session):
        """GET /api/settings returns 200 with settings object."""
        resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert "monitoring_interval_seconds" in body
        assert "retention_days" in body
        assert "check_timeout_ms" in body
        assert isinstance(body["monitoring_interval_seconds"], int)
        assert isinstance(body["retention_days"], int)
        assert isinstance(body["check_timeout_ms"], int)


class TestUpdateSettings:
    """PUT /api/settings -- update settings.
    This is critical: the updateSettings bug fix removed an extra SQL parameter
    that was causing runtime errors.
    """

    def test_update_monitoring_interval(self, admin_session):
        """PUT /api/settings can update monitoring_interval_seconds."""
        # Get current settings
        get_resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        assert get_resp.status_code == 200
        original = get_resp.json()

        # Update monitoring interval
        resp = admin_session.put(
            f"{BASE_URL}/api/settings",
            json={"monitoring_interval_seconds": 600},
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

        # Verify the change
        verify_resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        assert verify_resp.status_code == 200
        updated = verify_resp.json()
        assert updated["monitoring_interval_seconds"] == 600

        # Restore original
        admin_session.put(
            f"{BASE_URL}/api/settings",
            json={
                "monitoring_interval_seconds": original[
                    "monitoring_interval_seconds"
                ]
            },
            timeout=10,
        )

    def test_update_retention_days(self, admin_session):
        """PUT /api/settings can update retention_days."""
        get_resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        original = get_resp.json()

        resp = admin_session.put(
            f"{BASE_URL}/api/settings",
            json={"retention_days": 60},
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        verify = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        assert verify.json()["retention_days"] == 60

        # Restore
        admin_session.put(
            f"{BASE_URL}/api/settings",
            json={"retention_days": original["retention_days"]},
            timeout=10,
        )

    def test_update_check_timeout(self, admin_session):
        """PUT /api/settings can update check_timeout_ms."""
        get_resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        original = get_resp.json()

        resp = admin_session.put(
            f"{BASE_URL}/api/settings",
            json={"check_timeout_ms": 15000},
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        verify = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        assert verify.json()["check_timeout_ms"] == 15000

        # Restore
        admin_session.put(
            f"{BASE_URL}/api/settings",
            json={"check_timeout_ms": original["check_timeout_ms"]},
            timeout=10,
        )

    def test_update_multiple_settings_at_once(self, admin_session):
        """PUT /api/settings can update multiple fields at once."""
        get_resp = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        original = get_resp.json()

        resp = admin_session.put(
            f"{BASE_URL}/api/settings",
            json={
                "monitoring_interval_seconds": 120,
                "retention_days": 14,
                "check_timeout_ms": 5000,
            },
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        verify = admin_session.get(f"{BASE_URL}/api/settings", timeout=10)
        updated = verify.json()
        assert updated["monitoring_interval_seconds"] == 120
        assert updated["retention_days"] == 14
        assert updated["check_timeout_ms"] == 5000

        # Restore
        admin_session.put(
            f"{BASE_URL}/api/settings",
            json={
                "monitoring_interval_seconds": original[
                    "monitoring_interval_seconds"
                ],
                "retention_days": original["retention_days"],
                "check_timeout_ms": original["check_timeout_ms"],
            },
            timeout=10,
        )

    def test_update_settings_empty_body_accepted(self, admin_session):
        """PUT /api/settings with empty body is accepted (no-op update)."""
        resp = admin_session.put(
            f"{BASE_URL}/api/settings", json={}, timeout=10
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

    def test_update_settings_invalid_json_returns_400(self, admin_session):
        """PUT /api/settings with invalid JSON returns 400."""
        resp = admin_session.put(
            f"{BASE_URL}/api/settings",
            data="not valid json",
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        assert resp.status_code == 400
