"""
Functional tests for /api/applications endpoints.
Tests CRUD operations for applications.
"""
import os
import uuid
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"
NS = f"ftapp_{uuid.uuid4().hex[:8]}"


class TestApplicationsUnauthorized:
    """Verify all application endpoints require auth."""

    def test_get_applications_unauthorized(self):
        """GET /api/applications without auth returns 401."""
        resp = requests.get(f"{BASE_URL}/api/applications", timeout=10)
        assert resp.status_code == 401

    def test_post_applications_unauthorized(self):
        """POST /api/applications without auth returns 401."""
        resp = requests.post(
            f"{BASE_URL}/api/applications",
            json={"name": "test", "public_url": "http://example.com"},
            timeout=10,
        )
        assert resp.status_code == 401


class TestListApplications:
    """GET /api/applications -- list all applications."""

    def test_list_applications_returns_200(self, admin_session):
        """GET /api/applications returns 200 with array."""
        resp = admin_session.get(f"{BASE_URL}/api/applications", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)


class TestCreateApplication:
    """POST /api/applications -- create a new application."""

    def test_create_application_success(self, admin_session):
        """POST /api/applications with valid data returns 201."""
        payload = {
            "name": f"{NS}_testapp",
            "public_url": "https://example.com",
            "description": "A test application",
        }
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json=payload, timeout=10
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body

        # Cleanup
        app_id = body["id"]
        admin_session.delete(
            f"{BASE_URL}/api/applications/{app_id}", timeout=10
        )

    def test_create_application_missing_name_returns_400(self, admin_session):
        """POST /api/applications without name returns 400."""
        payload = {"public_url": "https://example.com"}
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json=payload, timeout=10
        )
        assert resp.status_code == 400

    def test_create_application_missing_url_returns_400(self, admin_session):
        """POST /api/applications without public_url returns 400."""
        payload = {"name": f"{NS}_nourl"}
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json=payload, timeout=10
        )
        assert resp.status_code == 400

    def test_create_application_with_all_fields(self, admin_session):
        """POST /api/applications with all optional fields returns 201."""
        payload = {
            "name": f"{NS}_fullapp",
            "public_url": "https://full.example.com",
            "description": "Full test application",
            "health_check_url": "https://full.example.com/health",
            "icon": "globe",
            "tags": ["web", "test"],
            "notes": "Test notes",
            "docker_label": "test-label",
            "public_monitoring_enabled": True,
            "internal_monitoring_enabled": False,
            "failure_threshold": 5,
        }
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json=payload, timeout=10
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body

        # Verify it appears in the list
        list_resp = admin_session.get(
            f"{BASE_URL}/api/applications", timeout=10
        )
        assert list_resp.status_code == 200
        apps = list_resp.json()
        created = [a for a in apps if a["id"] == body["id"]]
        assert len(created) == 1
        assert created[0]["name"] == f"{NS}_fullapp"
        assert created[0]["description"] == "Full test application"

        # Cleanup
        admin_session.delete(
            f"{BASE_URL}/api/applications/{body['id']}", timeout=10
        )

    def test_create_application_empty_body_returns_400(self, admin_session):
        """POST /api/applications with empty body returns 400."""
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json={}, timeout=10
        )
        assert resp.status_code == 400


class TestUpdateApplication:
    """PUT /api/applications/[id] -- update an application."""

    @pytest.fixture
    def created_app(self, admin_session):
        """Create an app for update tests, clean up after."""
        payload = {
            "name": f"{NS}_update_target",
            "public_url": "https://update.example.com",
        }
        resp = admin_session.post(
            f"{BASE_URL}/api/applications", json=payload, timeout=10
        )
        assert resp.status_code == 201
        app_id = resp.json()["id"]
        yield app_id
        admin_session.delete(
            f"{BASE_URL}/api/applications/{app_id}", timeout=10
        )

    def test_update_application_success(self, admin_session, created_app):
        """PUT /api/applications/[id] with valid data returns 200."""
        resp = admin_session.put(
            f"{BASE_URL}/api/applications/{created_app}",
            json={"name": f"{NS}_updated_name"},
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

    def test_update_application_not_found(self, admin_session):
        """PUT /api/applications/[id] with non-existent id returns 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_session.put(
            f"{BASE_URL}/api/applications/{fake_id}",
            json={"name": "ghost"},
            timeout=10,
        )
        assert resp.status_code == 404

    def test_update_application_unauthorized(self):
        """PUT /api/applications/[id] without auth returns 401."""
        fake_id = str(uuid.uuid4())
        resp = requests.put(
            f"{BASE_URL}/api/applications/{fake_id}",
            json={"name": "nope"},
            timeout=10,
        )
        assert resp.status_code == 401


class TestDeleteApplication:
    """DELETE /api/applications/[id] -- delete an application."""

    def test_delete_application_success(self, admin_session):
        """DELETE /api/applications/[id] deletes and returns 200."""
        # Create app to delete
        resp = admin_session.post(
            f"{BASE_URL}/api/applications",
            json={
                "name": f"{NS}_to_delete",
                "public_url": "https://delete.example.com",
            },
            timeout=10,
        )
        assert resp.status_code == 201
        app_id = resp.json()["id"]

        # Delete it
        resp = admin_session.delete(
            f"{BASE_URL}/api/applications/{app_id}", timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

    def test_delete_application_not_found(self, admin_session):
        """DELETE /api/applications/[id] with non-existent id returns 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_session.delete(
            f"{BASE_URL}/api/applications/{fake_id}", timeout=10
        )
        assert resp.status_code == 404

    def test_delete_application_unauthorized(self):
        """DELETE /api/applications/[id] without auth returns 401."""
        fake_id = str(uuid.uuid4())
        resp = requests.delete(
            f"{BASE_URL}/api/applications/{fake_id}", timeout=10
        )
        assert resp.status_code == 401
