"""
Capture actual responses from each test and print them for recording.
This script runs standalone (not via pytest) to get raw response data.
"""
import os
import sys
import json
import requests
import uuid
import time

BASE_URL = f"http://localhost:{os.environ.get('PORT', '3000')}"
ADMIN_EMAIL = "ftadmin@dohub.test"
ADMIN_PASSWORD = "FtTestPassword123!"
NS = f"ftcap_{uuid.uuid4().hex[:8]}"


def get_admin_session():
    """Get an authenticated session."""
    session = requests.Session()
    resp = session.get(f"{BASE_URL}/api/auth", timeout=10)
    setup_required = resp.json().get("setupRequired", False)

    if setup_required:
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={"action": "setup", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10,
        )
    else:
        resp = session.post(
            f"{BASE_URL}/api/auth",
            json={"action": "login", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10,
        )

    return session


def capture_all():
    results = {}

    # Auth tests
    # 1. GET /api/auth
    r = requests.get(f"{BASE_URL}/api/auth", timeout=10)
    results["test_auth_status_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/auth"
    }

    # Get admin session
    session = get_admin_session()

    # 2. setup creates admin - already done, check setupRequired
    r = requests.get(f"{BASE_URL}/api/auth", timeout=10)
    results["test_setup_creates_admin"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/auth"
    }

    # 3. duplicate admin
    r = requests.post(f"{BASE_URL}/api/auth",
        json={"action": "setup", "email": "another@test.com", "password": "AnotherPass123!"},
        timeout=10)
    results["test_setup_duplicate_admin_returns_409"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 4. login success
    s2 = requests.Session()
    r = s2.post(f"{BASE_URL}/api/auth",
        json={"action": "login", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10)
    results["test_login_success"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 5. wrong password
    r = requests.post(f"{BASE_URL}/api/auth",
        json={"action": "login", "email": ADMIN_EMAIL, "password": "WrongPassword999!"},
        timeout=10)
    results["test_login_wrong_password_returns_401"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 6. wrong email
    r = requests.post(f"{BASE_URL}/api/auth",
        json={"action": "login", "email": "nonexistent@test.com", "password": "SomePassword123!"},
        timeout=10)
    results["test_login_wrong_email_returns_401"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 7. missing fields
    r = requests.post(f"{BASE_URL}/api/auth", json={"action": "login"}, timeout=10)
    results["test_login_missing_fields_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 8. short password
    r = requests.post(f"{BASE_URL}/api/auth",
        json={"action": "setup", "email": "short@test.com", "password": "abc"},
        timeout=10)
    results["test_login_short_password_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 9. unknown action
    r = requests.post(f"{BASE_URL}/api/auth",
        json={"action": "unknown_action", "email": "test@test.com", "password": "TestPassword123!"},
        timeout=10)
    results["test_login_unknown_action_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 10. empty body
    r = requests.post(f"{BASE_URL}/api/auth", json={}, timeout=10)
    results["test_login_empty_body_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth"
    }

    # 11. logout success
    s3 = requests.Session()
    s3.post(f"{BASE_URL}/api/auth",
        json={"action": "login", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10)
    r = s3.post(f"{BASE_URL}/api/auth/logout", timeout=10)
    results["test_logout_success"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth/logout"
    }

    # 12. logout without session
    r = requests.post(f"{BASE_URL}/api/auth/logout", timeout=10)
    results["test_logout_without_session_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/auth/logout"
    }

    # 13. session invalid after logout
    s4 = requests.Session()
    s4.post(f"{BASE_URL}/api/auth",
        json={"action": "login", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10)
    s4.post(f"{BASE_URL}/api/auth/logout", timeout=10)
    r = s4.get(f"{BASE_URL}/api/applications", timeout=10)
    results["test_session_invalid_after_logout"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/applications"
    }

    # Applications tests
    # 14. unauthorized GET
    r = requests.get(f"{BASE_URL}/api/applications", timeout=10)
    results["test_get_applications_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/applications"
    }

    # 15. unauthorized POST
    r = requests.post(f"{BASE_URL}/api/applications",
        json={"name": "test", "public_url": "http://example.com"}, timeout=10)
    results["test_post_applications_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }

    # 16. list applications
    r = session.get(f"{BASE_URL}/api/applications", timeout=10)
    results["test_list_applications_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/applications"
    }

    # 17. create application success
    r = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_testapp", "public_url": "https://example.com", "description": "A test app"},
        timeout=10)
    results["test_create_application_success"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }
    if r.status_code == 201:
        app_id = r.json()["id"]
        session.delete(f"{BASE_URL}/api/applications/{app_id}", timeout=10)

    # 18. missing name
    r = session.post(f"{BASE_URL}/api/applications",
        json={"public_url": "https://example.com"}, timeout=10)
    results["test_create_application_missing_name_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }

    # 19. missing url
    r = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_nourl"}, timeout=10)
    results["test_create_application_missing_url_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }

    # 20. create with all fields
    r = session.post(f"{BASE_URL}/api/applications",
        json={
            "name": f"{NS}_fullapp", "public_url": "https://full.example.com",
            "description": "Full app", "health_check_url": "https://full.example.com/health",
            "icon": "globe", "tags": ["web", "test"], "notes": "Notes",
            "docker_label": "test", "public_monitoring_enabled": True,
            "internal_monitoring_enabled": False, "failure_threshold": 5,
        }, timeout=10)
    results["test_create_application_with_all_fields"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }
    if r.status_code == 201:
        session.delete(f"{BASE_URL}/api/applications/{r.json()['id']}", timeout=10)

    # 21. empty body
    r = session.post(f"{BASE_URL}/api/applications", json={}, timeout=10)
    results["test_create_application_empty_body_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/applications"
    }

    # 22. update success
    cr = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_upd", "public_url": "https://upd.example.com"}, timeout=10)
    upd_id = cr.json()["id"]
    r = session.put(f"{BASE_URL}/api/applications/{upd_id}",
        json={"name": f"{NS}_updated"}, timeout=10)
    results["test_update_application_success"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/applications/{upd_id}"
    }
    session.delete(f"{BASE_URL}/api/applications/{upd_id}", timeout=10)

    # 23. update not found
    fake_id = str(uuid.uuid4())
    r = session.put(f"{BASE_URL}/api/applications/{fake_id}",
        json={"name": "ghost"}, timeout=10)
    results["test_update_application_not_found"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/applications/{fake_id}"
    }

    # 24. update unauthorized
    r = requests.put(f"{BASE_URL}/api/applications/{fake_id}",
        json={"name": "nope"}, timeout=10)
    results["test_update_application_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/applications/{fake_id}"
    }

    # 25. delete success
    cr = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_del", "public_url": "https://del.example.com"}, timeout=10)
    del_id = cr.json()["id"]
    r = session.delete(f"{BASE_URL}/api/applications/{del_id}", timeout=10)
    results["test_delete_application_success"] = {
        "status": r.status_code, "body": r.text, "method": "DELETE",
        "endpoint": f"/api/applications/{del_id}"
    }

    # 26. delete not found
    r = session.delete(f"{BASE_URL}/api/applications/{fake_id}", timeout=10)
    results["test_delete_application_not_found"] = {
        "status": r.status_code, "body": r.text, "method": "DELETE",
        "endpoint": f"/api/applications/{fake_id}"
    }

    # 27. delete unauthorized
    r = requests.delete(f"{BASE_URL}/api/applications/{fake_id}", timeout=10)
    results["test_delete_application_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "DELETE",
        "endpoint": f"/api/applications/{fake_id}"
    }

    # Categories tests
    # 28. unauthorized GET
    r = requests.get(f"{BASE_URL}/api/categories", timeout=10)
    results["test_get_categories_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/categories"
    }

    # 29. unauthorized POST
    r = requests.post(f"{BASE_URL}/api/categories", json={"name": "test"}, timeout=10)
    results["test_post_categories_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/categories"
    }

    # 30. list categories
    r = session.get(f"{BASE_URL}/api/categories", timeout=10)
    results["test_list_categories_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/categories"
    }

    # 31. create category success
    r = session.post(f"{BASE_URL}/api/categories",
        json={"name": f"{NS}_webapps", "icon": "globe", "color": "#3b82f6"}, timeout=10)
    results["test_create_category_success"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/categories"
    }
    if r.status_code == 201:
        session.delete(f"{BASE_URL}/api/categories/{r.json()['id']}", timeout=10)

    # 32. missing name
    r = session.post(f"{BASE_URL}/api/categories", json={"icon": "globe"}, timeout=10)
    results["test_create_category_missing_name_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/categories"
    }

    # 33. name only
    r = session.post(f"{BASE_URL}/api/categories",
        json={"name": f"{NS}_minimal"}, timeout=10)
    results["test_create_category_name_only"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/categories"
    }
    if r.status_code == 201:
        session.delete(f"{BASE_URL}/api/categories/{r.json()['id']}", timeout=10)

    # 34. update success
    cr = session.post(f"{BASE_URL}/api/categories",
        json={"name": f"{NS}_upd", "icon": "star"}, timeout=10)
    cat_id = cr.json()["id"]
    r = session.put(f"{BASE_URL}/api/categories/{cat_id}",
        json={"name": f"{NS}_updated_cat"}, timeout=10)
    results["test_update_category_success"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/categories/{cat_id}"
    }
    session.delete(f"{BASE_URL}/api/categories/{cat_id}", timeout=10)

    # 35. update not found
    r = session.put(f"{BASE_URL}/api/categories/{fake_id}",
        json={"name": "ghost"}, timeout=10)
    results["test_update_category_not_found"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/categories/{fake_id}"
    }

    # 36. update unauthorized
    r = requests.put(f"{BASE_URL}/api/categories/{fake_id}",
        json={"name": "nope"}, timeout=10)
    results["test_update_category_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": f"/api/categories/{fake_id}"
    }

    # 37. delete success
    cr = session.post(f"{BASE_URL}/api/categories",
        json={"name": f"{NS}_del"}, timeout=10)
    cat_del_id = cr.json()["id"]
    r = session.delete(f"{BASE_URL}/api/categories/{cat_del_id}", timeout=10)
    results["test_delete_category_success"] = {
        "status": r.status_code, "body": r.text, "method": "DELETE",
        "endpoint": f"/api/categories/{cat_del_id}"
    }

    # 38. delete not found
    r = session.delete(f"{BASE_URL}/api/categories/{fake_id}", timeout=10)
    results["test_delete_category_not_found"] = {
        "status": r.status_code, "body": r.text, "method": "DELETE",
        "endpoint": f"/api/categories/{fake_id}"
    }

    # 39. delete cascades
    cr = session.post(f"{BASE_URL}/api/categories",
        json={"name": f"{NS}_cascade"}, timeout=10)
    cas_cat_id = cr.json()["id"]
    app_r = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_casapp", "public_url": "https://cas.example.com", "category_id": cas_cat_id},
        timeout=10)
    cas_app_id = app_r.json()["id"]
    r = session.delete(f"{BASE_URL}/api/categories/{cas_cat_id}", timeout=10)
    # Verify app still exists with null category
    app_check = session.get(f"{BASE_URL}/api/applications", timeout=10)
    apps = app_check.json()
    cas_app = [a for a in apps if a["id"] == cas_app_id]
    cascade_ok = len(cas_app) == 1 and cas_app[0]["category_id"] is None
    results["test_delete_category_cascades_to_apps"] = {
        "status": r.status_code, "body": json.dumps({"success": True, "cascade_verified": cascade_ok}),
        "method": "DELETE", "endpoint": f"/api/categories/{cas_cat_id}"
    }
    session.delete(f"{BASE_URL}/api/applications/{cas_app_id}", timeout=10)

    # Settings tests
    # 40. unauthorized GET
    r = requests.get(f"{BASE_URL}/api/settings", timeout=10)
    results["test_get_settings_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/settings"
    }

    # 41. unauthorized PUT
    r = requests.put(f"{BASE_URL}/api/settings",
        json={"monitoring_interval_seconds": 300}, timeout=10)
    results["test_put_settings_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": "/api/settings"
    }

    # 42. get settings
    r = session.get(f"{BASE_URL}/api/settings", timeout=10)
    results["test_get_settings_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/settings"
    }

    # Get original settings for restore
    orig_settings = r.json()

    # 43-47. update settings
    for test_name, update_data, verify_key, verify_val in [
        ("test_update_monitoring_interval", {"monitoring_interval_seconds": 600}, "monitoring_interval_seconds", 600),
        ("test_update_retention_days", {"retention_days": 60}, "retention_days", 60),
        ("test_update_check_timeout", {"check_timeout_ms": 15000}, "check_timeout_ms", 15000),
    ]:
        r = session.put(f"{BASE_URL}/api/settings", json=update_data, timeout=10)
        results[test_name] = {
            "status": r.status_code, "body": r.text, "method": "PUT",
            "endpoint": "/api/settings"
        }
        # Restore
        session.put(f"{BASE_URL}/api/settings",
            json={verify_key: orig_settings[verify_key]}, timeout=10)

    # 46. multiple at once
    r = session.put(f"{BASE_URL}/api/settings",
        json={"monitoring_interval_seconds": 120, "retention_days": 14, "check_timeout_ms": 5000},
        timeout=10)
    results["test_update_multiple_settings_at_once"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": "/api/settings"
    }
    # Restore
    session.put(f"{BASE_URL}/api/settings", json={
        "monitoring_interval_seconds": orig_settings["monitoring_interval_seconds"],
        "retention_days": orig_settings["retention_days"],
        "check_timeout_ms": orig_settings["check_timeout_ms"],
    }, timeout=10)

    # 47. empty body accepted
    r = session.put(f"{BASE_URL}/api/settings", json={}, timeout=10)
    results["test_update_settings_empty_body_accepted"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": "/api/settings"
    }

    # 48. invalid json
    r = session.put(f"{BASE_URL}/api/settings",
        data="not valid json", headers={"Content-Type": "application/json"}, timeout=10)
    results["test_update_settings_invalid_json_returns_400"] = {
        "status": r.status_code, "body": r.text, "method": "PUT",
        "endpoint": "/api/settings"
    }

    # Monitoring tests
    # 49. unauthorized GET results
    r = requests.get(f"{BASE_URL}/api/monitoring/results", timeout=10)
    results["test_get_results_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/monitoring/results"
    }

    # 50. unauthorized run-checks
    r = requests.post(f"{BASE_URL}/api/monitoring/run-checks", timeout=10)
    results["test_run_checks_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/monitoring/run-checks"
    }

    # 51. unauthorized single check
    r = requests.post(f"{BASE_URL}/api/monitoring/check/{fake_id}", timeout=10)
    results["test_check_single_unauthorized"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": f"/api/monitoring/check/{fake_id}"
    }

    # 52. get results
    r = session.get(f"{BASE_URL}/api/monitoring/results", timeout=10)
    results["test_get_results_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/monitoring/results"
    }

    # 53. get results with limit
    r = session.get(f"{BASE_URL}/api/monitoring/results?limit=5", timeout=10)
    results["test_get_results_with_limit"] = {
        "status": r.status_code, "body": r.text, "method": "GET",
        "endpoint": "/api/monitoring/results?limit=5"
    }

    # 54. run all checks
    r = session.post(f"{BASE_URL}/api/monitoring/run-checks", timeout=60)
    results["test_run_checks_returns_200"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/monitoring/run-checks"
    }

    # 55. run checks with app
    app_r = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_monapp", "public_url": "https://httpbin.org/get",
              "public_monitoring_enabled": True}, timeout=10)
    mon_app_id = app_r.json()["id"]
    r = session.post(f"{BASE_URL}/api/monitoring/run-checks", timeout=60)
    results["test_run_checks_with_app"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": "/api/monitoring/run-checks"
    }
    session.delete(f"{BASE_URL}/api/applications/{mon_app_id}", timeout=10)

    # 56. single check not found
    r = session.post(f"{BASE_URL}/api/monitoring/check/{fake_id}", timeout=30)
    results["test_check_single_app_not_found"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": f"/api/monitoring/check/{fake_id}"
    }

    # 57. single check success
    app_r = session.post(f"{BASE_URL}/api/applications",
        json={"name": f"{NS}_scheck", "public_url": "https://httpbin.org/get",
              "public_monitoring_enabled": True}, timeout=10)
    sch_app_id = app_r.json()["id"]
    r = session.post(f"{BASE_URL}/api/monitoring/check/{sch_app_id}", timeout=30)
    results["test_check_single_app_success"] = {
        "status": r.status_code, "body": r.text, "method": "POST",
        "endpoint": f"/api/monitoring/check/{sch_app_id}"
    }
    session.delete(f"{BASE_URL}/api/applications/{sch_app_id}", timeout=10)

    return results


if __name__ == "__main__":
    results = capture_all()
    # Output as JSON for the recording script
    json.dump(results, sys.stdout, indent=2)
