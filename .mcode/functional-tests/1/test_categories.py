"""
Functional tests for /api/categories endpoints.
Tests CRUD operations for categories.
"""
import os
import uuid
import requests
import pytest

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"
NS = f"ftcat_{uuid.uuid4().hex[:8]}"


class TestCategoriesUnauthorized:
    """Verify category endpoints require auth."""

    def test_get_categories_unauthorized(self):
        """GET /api/categories without auth returns 401."""
        resp = requests.get(f"{BASE_URL}/api/categories", timeout=10)
        assert resp.status_code == 401

    def test_post_categories_unauthorized(self):
        """POST /api/categories without auth returns 401."""
        resp = requests.post(
            f"{BASE_URL}/api/categories",
            json={"name": "test"},
            timeout=10,
        )
        assert resp.status_code == 401


class TestListCategories:
    """GET /api/categories -- list all categories."""

    def test_list_categories_returns_200(self, admin_session):
        """GET /api/categories returns 200 with array."""
        resp = admin_session.get(f"{BASE_URL}/api/categories", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)


class TestCreateCategory:
    """POST /api/categories -- create a new category."""

    def test_create_category_success(self, admin_session):
        """POST /api/categories with valid data returns 201."""
        payload = {
            "name": f"{NS}_webapps",
            "icon": "globe",
            "color": "#3b82f6",
        }
        resp = admin_session.post(
            f"{BASE_URL}/api/categories", json=payload, timeout=10
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body

        # Cleanup
        admin_session.delete(
            f"{BASE_URL}/api/categories/{body['id']}", timeout=10
        )

    def test_create_category_missing_name_returns_400(self, admin_session):
        """POST /api/categories without name returns 400."""
        resp = admin_session.post(
            f"{BASE_URL}/api/categories", json={"icon": "globe"}, timeout=10
        )
        assert resp.status_code == 400

    def test_create_category_name_only(self, admin_session):
        """POST /api/categories with only name returns 201."""
        payload = {"name": f"{NS}_minimal"}
        resp = admin_session.post(
            f"{BASE_URL}/api/categories", json=payload, timeout=10
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body

        # Verify in list
        list_resp = admin_session.get(
            f"{BASE_URL}/api/categories", timeout=10
        )
        cats = list_resp.json()
        created = [c for c in cats if c["id"] == body["id"]]
        assert len(created) == 1
        assert created[0]["name"] == f"{NS}_minimal"

        # Cleanup
        admin_session.delete(
            f"{BASE_URL}/api/categories/{body['id']}", timeout=10
        )


class TestUpdateCategory:
    """PUT /api/categories/[id] -- update a category."""

    @pytest.fixture
    def created_category(self, admin_session):
        """Create a category for update tests."""
        payload = {"name": f"{NS}_update_target", "icon": "star"}
        resp = admin_session.post(
            f"{BASE_URL}/api/categories", json=payload, timeout=10
        )
        assert resp.status_code == 201
        cat_id = resp.json()["id"]
        yield cat_id
        admin_session.delete(
            f"{BASE_URL}/api/categories/{cat_id}", timeout=10
        )

    def test_update_category_success(self, admin_session, created_category):
        """PUT /api/categories/[id] with valid data returns 200."""
        resp = admin_session.put(
            f"{BASE_URL}/api/categories/{created_category}",
            json={"name": f"{NS}_updated_cat"},
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

    def test_update_category_not_found(self, admin_session):
        """PUT /api/categories/[id] with non-existent id returns 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_session.put(
            f"{BASE_URL}/api/categories/{fake_id}",
            json={"name": "ghost"},
            timeout=10,
        )
        assert resp.status_code == 404

    def test_update_category_unauthorized(self):
        """PUT /api/categories/[id] without auth returns 401."""
        fake_id = str(uuid.uuid4())
        resp = requests.put(
            f"{BASE_URL}/api/categories/{fake_id}",
            json={"name": "nope"},
            timeout=10,
        )
        assert resp.status_code == 401


class TestDeleteCategory:
    """DELETE /api/categories/[id] -- delete a category."""

    def test_delete_category_success(self, admin_session):
        """DELETE /api/categories/[id] returns 200."""
        # Create to delete
        resp = admin_session.post(
            f"{BASE_URL}/api/categories",
            json={"name": f"{NS}_to_delete"},
            timeout=10,
        )
        assert resp.status_code == 201
        cat_id = resp.json()["id"]

        # Delete
        resp = admin_session.delete(
            f"{BASE_URL}/api/categories/{cat_id}", timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body.get("success") is True

    def test_delete_category_not_found(self, admin_session):
        """DELETE /api/categories/[id] with non-existent id returns 404."""
        fake_id = str(uuid.uuid4())
        resp = admin_session.delete(
            f"{BASE_URL}/api/categories/{fake_id}", timeout=10
        )
        assert resp.status_code == 404

    def test_delete_category_cascades_to_apps(self, admin_session):
        """Deleting a category sets category_id to NULL on associated apps."""
        # Create category
        cat_resp = admin_session.post(
            f"{BASE_URL}/api/categories",
            json={"name": f"{NS}_cascade_test"},
            timeout=10,
        )
        assert cat_resp.status_code == 201
        cat_id = cat_resp.json()["id"]

        # Create app with that category
        app_resp = admin_session.post(
            f"{BASE_URL}/api/applications",
            json={
                "name": f"{NS}_cascade_app",
                "public_url": "https://cascade.example.com",
                "category_id": cat_id,
            },
            timeout=10,
        )
        assert app_resp.status_code == 201
        app_id = app_resp.json()["id"]

        # Delete category
        del_resp = admin_session.delete(
            f"{BASE_URL}/api/categories/{cat_id}", timeout=10
        )
        assert del_resp.status_code == 200

        # Verify app still exists but category_id is null
        apps_resp = admin_session.get(
            f"{BASE_URL}/api/applications", timeout=10
        )
        apps = apps_resp.json()
        app = [a for a in apps if a["id"] == app_id]
        assert len(app) == 1
        assert app[0]["category_id"] is None

        # Cleanup app
        admin_session.delete(
            f"{BASE_URL}/api/applications/{app_id}", timeout=10
        )
