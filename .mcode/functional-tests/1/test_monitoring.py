"""
Functional tests for /api/monitoring endpoints.
Tests health check execution and results retrieval.
"""
import os
import uuid
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"
NS = f"ftmon_{uuid.uuid4().hex[:8]}"


class TestMonitoringUnauthorized:
    """Verify monitoring endpoints require auth."""

    def test_get_results_unauthorized(self):
        """GET /api/monitoring/results without auth returns 401."""
        resp = requests.get(f"{BASE_URL}/api/monitoring/results", timeout=10)
        assert resp.status_code == 401

    def test_run_checks_unauthorized(self):
        """POST /api/monitoring/run-checks without auth returns 401."""
        resp = requests.post(
            f"{BASE_URL}/api/monitoring/run-checks", timeout=10
        )
        assert resp.status_code == 401

    def test_check_single_unauthorized(self):
        """POST /api/monitoring/check/[id] without auth returns 401."""
        fake_id = str(uuid.uuid4())
        resp = requests.post(
            f"{BASE_URL}/api/monitoring/check/{fake_id}", timeout=10
        )
        assert resp.status_code == 401


class TestMonitoringResults:
    """GET /api/monitoring/results -- list check results."""

    def test_get_results_returns_200(self, admin_session):
        """GET /api/monitoring/results returns 200 with array."""
        resp = admin_session.get(
            f"{BASE_URL}/api/monitoring/results", timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)

    def test_get_results_with_limit(self, admin_session):
        """GET /api/monitoring/results?limit=5 respects limit param."""
        resp = admin_session.get(
            f"{BASE_URL}/api/monitoring/results?limit=5", timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) <= 5


class TestRunAllChecks:
    """POST /api/monitoring/run-checks -- run health checks for all apps."""

    def test_run_checks_returns_200(self, admin_session):
        """POST /api/monitoring/run-checks returns 200 with results."""
        resp = admin_session.post(
            f"{BASE_URL}/api/monitoring/run-checks", timeout=60
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "results" in body
        assert isinstance(body["results"], list)

    def test_run_checks_with_app(self, admin_session):
        """Run checks after creating an app with monitoring enabled."""
        # Create an app with monitoring
        app_resp = admin_session.post(
            f"{BASE_URL}/api/applications",
            json={
                "name": f"{NS}_monitored_app",
                "public_url": "https://httpbin.org/get",
                "public_monitoring_enabled": True,
            },
            timeout=10,
        )
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        try:
            # Run checks
            resp = admin_session.post(
                f"{BASE_URL}/api/monitoring/run-checks", timeout=60
            )
            assert resp.status_code == 200
            body = resp.json()
            assert "results" in body
            # Should have at least one result for our app
            assert len(body["results"]) >= 1
        finally:
            # Cleanup
            admin_session.delete(
                f"{BASE_URL}/api/applications/{app_id}", timeout=10
            )


class TestCheckSingleApp:
    """POST /api/monitoring/check/[id] -- run check for single app."""

    def test_check_single_app_not_found(self, admin_session):
        """POST /api/monitoring/check/[id] with non-existent id returns 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_session.post(
            f"{BASE_URL}/api/monitoring/check/{fake_id}", timeout=30
        )
        assert resp.status_code == 404

    def test_check_single_app_success(self, admin_session):
        """POST /api/monitoring/check/[id] runs check and returns result."""
        # Create an app to check
        app_resp = admin_session.post(
            f"{BASE_URL}/api/applications",
            json={
                "name": f"{NS}_single_check",
                "public_url": "https://httpbin.org/get",
                "public_monitoring_enabled": True,
            },
            timeout=10,
        )
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        try:
            # Run single check
            resp = admin_session.post(
                f"{BASE_URL}/api/monitoring/check/{app_id}", timeout=30
            )
            assert resp.status_code == 200
            body = resp.json()
            # Should have public check result (public monitoring enabled)
            assert "public" in body
            assert body["public"]["status"] in ("up", "down")
        finally:
            # Cleanup
            admin_session.delete(
                f"{BASE_URL}/api/applications/{app_id}", timeout=10
            )
