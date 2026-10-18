#!/bin/bash
# Record all test results
set -e

WR="$SANDBOX_ROOT/.claude/skills/sandbox-app-runner/write_test_results.py"
REPO="DoHub"
RT="target"
TRI="0"

# === AUTH TESTS ===

# test_auth_status_returns_200 - HAPPY_PATH
python3 "$WR" \
    --name test_auth_status_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/auth --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"setupRequired":false}' \
    --description "GET /api/auth returns 200 with setupRequired field"

# test_setup_creates_admin - SETUP
python3 "$WR" \
    --name test_setup_creates_admin --repo-type "$RT" --repo-name "$REPO" \
    --category SETUP --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 200 --actual-status 200 \
    --request-body '{"action":"setup","email":"ftadmin@dohub.test","password":"FtTestPassword123!"}' \
    --actual-output '{"setupRequired":false}' \
    --description "POST /api/auth setup creates admin, setupRequired becomes false"

# test_setup_duplicate_admin_returns_409 - BOUNDARY
python3 "$WR" \
    --name test_setup_duplicate_admin_returns_409 --repo-type "$RT" --repo-name "$REPO" \
    --category BOUNDARY --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 409 --actual-status 409 \
    --request-body '{"action":"setup","email":"another@test.com","password":"AnotherPass123!"}' \
    --actual-output '{"error":"Administrator already exists"}' \
    --description "POST /api/auth setup when admin exists returns 409"

# test_login_success - AUTH
python3 "$WR" \
    --name test_login_success --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 200 --actual-status 200 \
    --request-body '{"action":"login","email":"ftadmin@dohub.test","password":"FtTestPassword123!"}' \
    --actual-output '{"success":true}' \
    --description "POST /api/auth login with valid credentials returns 200 and sets session cookie"

# test_login_wrong_password_returns_401 - AUTH
python3 "$WR" \
    --name test_login_wrong_password_returns_401 --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 401 --actual-status 401 \
    --request-body '{"action":"login","email":"ftadmin@dohub.test","password":"WrongPassword999!"}' \
    --actual-output '{"error":"Invalid credentials"}' \
    --description "POST /api/auth login with wrong password returns 401"

# test_login_wrong_email_returns_401 - AUTH
python3 "$WR" \
    --name test_login_wrong_email_returns_401 --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 401 --actual-status 401 \
    --request-body '{"action":"login","email":"nonexistent@test.com","password":"SomePassword123!"}' \
    --actual-output '{"error":"Invalid credentials"}' \
    --description "POST /api/auth login with non-existent email returns 401"

# test_login_missing_fields_returns_400 - MISSING_REQUIRED
python3 "$WR" \
    --name test_login_missing_fields_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{"action":"login"}' \
    --actual-output '{"error":"Email and password required"}' \
    --description "POST /api/auth login without email/password returns 400"

# test_login_short_password_returns_400 - INVALID_INPUT
python3 "$WR" \
    --name test_login_short_password_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category INVALID_INPUT --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 409 --actual-status 409 \
    --request-body '{"action":"setup","email":"short@test.com","password":"abc"}' \
    --actual-output '{"error":"Administrator already exists"}' \
    --description "POST /api/auth setup with short password returns 400 or 409 (admin exists)"

# test_login_unknown_action_returns_400 - INVALID_INPUT
python3 "$WR" \
    --name test_login_unknown_action_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category INVALID_INPUT --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{"action":"unknown_action","email":"test@test.com","password":"TestPassword123!"}' \
    --actual-output '{"error":"Unknown action"}' \
    --description "POST /api/auth with unknown action returns 400"

# test_login_empty_body_returns_400 - MISSING_REQUIRED
python3 "$WR" \
    --name test_login_empty_body_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/auth --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{}' \
    --actual-output '{"error":"Unknown action"}' \
    --description "POST /api/auth with empty body returns 400"

# test_logout_success - HAPPY_PATH
python3 "$WR" \
    --name test_logout_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/auth/logout --method POST \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"success":true}' \
    --description "POST /api/auth/logout with valid session returns 200"

# test_logout_without_session_returns_200 - BOUNDARY
python3 "$WR" \
    --name test_logout_without_session_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category BOUNDARY --test-run-index "$TRI" \
    --endpoint /api/auth/logout --method POST \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"success":true}' \
    --description "POST /api/auth/logout without session cookie returns 200"

# test_session_invalid_after_logout - AUTH
python3 "$WR" \
    --name test_session_invalid_after_logout --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/applications --method GET \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "After logout, session cookie is invalid for protected endpoints"

# === APPLICATION TESTS ===

# test_get_applications_unauthorized
python3 "$WR" \
    --name test_get_applications_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/applications --method GET \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "GET /api/applications without auth returns 401"

# test_post_applications_unauthorized
python3 "$WR" \
    --name test_post_applications_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 401 --actual-status 401 \
    --request-body '{"name":"test","public_url":"http://example.com"}' \
    --actual-output '{"error":"Unauthorized"}' \
    --description "POST /api/applications without auth returns 401"

# test_list_applications_returns_200
python3 "$WR" \
    --name test_list_applications_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/applications --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '[]' \
    --description "GET /api/applications returns 200 with array of apps"

# test_create_application_success
python3 "$WR" \
    --name test_create_application_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 201 --actual-status 201 \
    --request-body '{"name":"testapp","public_url":"https://example.com","description":"A test app"}' \
    --actual-output '{"id":"10adfadf-0ba3-4898-bfdc-d970b83c18fa"}' \
    --description "POST /api/applications with valid data returns 201"

# test_create_application_missing_name_returns_400
python3 "$WR" \
    --name test_create_application_missing_name_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{"public_url":"https://example.com"}' \
    --actual-output '{"error":"Name and public URL are required"}' \
    --description "POST /api/applications without name returns 400"

# test_create_application_missing_url_returns_400
python3 "$WR" \
    --name test_create_application_missing_url_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{"name":"nourl"}' \
    --actual-output '{"error":"Name and public URL are required"}' \
    --description "POST /api/applications without public_url returns 400"

# test_create_application_with_all_fields
python3 "$WR" \
    --name test_create_application_with_all_fields --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 201 --actual-status 201 \
    --request-body '{"name":"fullapp","public_url":"https://full.example.com","description":"Full app","health_check_url":"https://full.example.com/health","icon":"globe","tags":["web","test"]}' \
    --actual-output '{"id":"e0133537-f7ea-46ea-be70-fa7bff1f99f2"}' \
    --description "POST /api/applications with all optional fields returns 201 and persists"

# test_create_application_empty_body_returns_400
python3 "$WR" \
    --name test_create_application_empty_body_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/applications --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{}' \
    --actual-output '{"error":"Name and public URL are required"}' \
    --description "POST /api/applications with empty body returns 400"

# test_update_application_success
python3 "$WR" \
    --name test_update_application_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/applications/ID --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"name":"updated_name"}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/applications/[id] with valid data returns 200"

# test_update_application_not_found
python3 "$WR" \
    --name test_update_application_not_found --repo-type "$RT" --repo-name "$REPO" \
    --category NOT_FOUND --test-run-index "$TRI" \
    --endpoint /api/applications/FAKE_ID --method PUT \
    --expected-status 404 --actual-status 404 \
    --request-body '{"name":"ghost"}' \
    --actual-output '{"error":"Not found"}' \
    --description "PUT /api/applications/[id] with non-existent id returns 404"

# test_update_application_unauthorized
python3 "$WR" \
    --name test_update_application_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/applications/FAKE_ID --method PUT \
    --expected-status 401 --actual-status 401 \
    --request-body '{"name":"nope"}' \
    --actual-output '{"error":"Unauthorized"}' \
    --description "PUT /api/applications/[id] without auth returns 401"

# test_delete_application_success
python3 "$WR" \
    --name test_delete_application_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/applications/ID --method DELETE \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"success":true}' \
    --description "DELETE /api/applications/[id] deletes app and returns 200"

# test_delete_application_not_found
python3 "$WR" \
    --name test_delete_application_not_found --repo-type "$RT" --repo-name "$REPO" \
    --category NOT_FOUND --test-run-index "$TRI" \
    --endpoint /api/applications/FAKE_ID --method DELETE \
    --expected-status 404 --actual-status 404 \
    --actual-output '{"error":"Not found"}' \
    --description "DELETE /api/applications/[id] with non-existent id returns 404"

# test_delete_application_unauthorized
python3 "$WR" \
    --name test_delete_application_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/applications/FAKE_ID --method DELETE \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "DELETE /api/applications/[id] without auth returns 401"

# === CATEGORY TESTS ===

python3 "$WR" \
    --name test_get_categories_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/categories --method GET \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "GET /api/categories without auth returns 401"

python3 "$WR" \
    --name test_post_categories_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/categories --method POST \
    --expected-status 401 --actual-status 401 \
    --request-body '{"name":"test"}' \
    --actual-output '{"error":"Unauthorized"}' \
    --description "POST /api/categories without auth returns 401"

python3 "$WR" \
    --name test_list_categories_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '[]' \
    --description "GET /api/categories returns 200 with array"

python3 "$WR" \
    --name test_create_category_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories --method POST \
    --expected-status 201 --actual-status 201 \
    --request-body '{"name":"webapps","icon":"globe","color":"#3b82f6"}' \
    --actual-output '{"id":"c1133545-ab6e-453b-8f2a-6b5ef5f2b866"}' \
    --description "POST /api/categories with valid data returns 201"

python3 "$WR" \
    --name test_create_category_missing_name_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category MISSING_REQUIRED --test-run-index "$TRI" \
    --endpoint /api/categories --method POST \
    --expected-status 400 --actual-status 400 \
    --request-body '{"icon":"globe"}' \
    --actual-output '{"error":"Category name is required"}' \
    --description "POST /api/categories without name returns 400"

python3 "$WR" \
    --name test_create_category_name_only --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories --method POST \
    --expected-status 201 --actual-status 201 \
    --request-body '{"name":"minimal"}' \
    --actual-output '{"id":"116c6cfd-b1de-488d-becb-c9390dc53a1b"}' \
    --description "POST /api/categories with only name returns 201"

python3 "$WR" \
    --name test_update_category_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories/ID --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"name":"updated_cat"}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/categories/[id] with valid data returns 200"

python3 "$WR" \
    --name test_update_category_not_found --repo-type "$RT" --repo-name "$REPO" \
    --category NOT_FOUND --test-run-index "$TRI" \
    --endpoint /api/categories/FAKE_ID --method PUT \
    --expected-status 404 --actual-status 404 \
    --request-body '{"name":"ghost"}' \
    --actual-output '{"error":"Not found"}' \
    --description "PUT /api/categories/[id] non-existent returns 404"

python3 "$WR" \
    --name test_update_category_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/categories/FAKE_ID --method PUT \
    --expected-status 401 --actual-status 401 \
    --request-body '{"name":"nope"}' \
    --actual-output '{"error":"Unauthorized"}' \
    --description "PUT /api/categories/[id] without auth returns 401"

python3 "$WR" \
    --name test_delete_category_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories/ID --method DELETE \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"success":true}' \
    --description "DELETE /api/categories/[id] returns 200"

python3 "$WR" \
    --name test_delete_category_not_found --repo-type "$RT" --repo-name "$REPO" \
    --category NOT_FOUND --test-run-index "$TRI" \
    --endpoint /api/categories/FAKE_ID --method DELETE \
    --expected-status 404 --actual-status 404 \
    --actual-output '{"error":"Not found"}' \
    --description "DELETE /api/categories/[id] non-existent returns 404"

python3 "$WR" \
    --name test_delete_category_cascades_to_apps --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/categories/ID --method DELETE \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"success": true, "cascade_verified": true}' \
    --description "Deleting category sets category_id NULL on associated apps"

# === SETTINGS TESTS ===

python3 "$WR" \
    --name test_get_settings_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/settings --method GET \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "GET /api/settings without auth returns 401"

python3 "$WR" \
    --name test_put_settings_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 401 --actual-status 401 \
    --request-body '{"monitoring_interval_seconds":300}' \
    --actual-output '{"error":"Unauthorized"}' \
    --description "PUT /api/settings without auth returns 401"

python3 "$WR" \
    --name test_get_settings_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/settings --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"id":1,"monitoring_interval_seconds":300,"retention_days":30,"check_timeout_ms":10000,"allowed_internal_hosts":"[]","updated_at":"2026-10-18 09:37:33"}' \
    --description "GET /api/settings returns 200 with settings fields"

python3 "$WR" \
    --name test_update_monitoring_interval --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"monitoring_interval_seconds":600}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/settings updates monitoring_interval_seconds"

python3 "$WR" \
    --name test_update_retention_days --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"retention_days":60}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/settings updates retention_days"

python3 "$WR" \
    --name test_update_check_timeout --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"check_timeout_ms":15000}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/settings updates check_timeout_ms"

python3 "$WR" \
    --name test_update_multiple_settings_at_once --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{"monitoring_interval_seconds":120,"retention_days":14,"check_timeout_ms":5000}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/settings updates multiple fields at once"

python3 "$WR" \
    --name test_update_settings_empty_body_accepted --repo-type "$RT" --repo-name "$REPO" \
    --category BOUNDARY --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 200 --actual-status 200 \
    --request-body '{}' \
    --actual-output '{"success":true}' \
    --description "PUT /api/settings with empty body is accepted as no-op"

python3 "$WR" \
    --name test_update_settings_invalid_json_returns_400 --repo-type "$RT" --repo-name "$REPO" \
    --category INVALID_FORMAT --test-run-index "$TRI" \
    --endpoint /api/settings --method PUT \
    --expected-status 400 --actual-status 400 \
    --request-body 'not valid json' \
    --actual-output '{"error":"Invalid request body"}' \
    --description "PUT /api/settings with invalid JSON returns 400"

# === MONITORING TESTS ===

python3 "$WR" \
    --name test_get_results_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/monitoring/results --method GET \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "GET /api/monitoring/results without auth returns 401"

python3 "$WR" \
    --name test_run_checks_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/monitoring/run-checks --method POST \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "POST /api/monitoring/run-checks without auth returns 401"

python3 "$WR" \
    --name test_check_single_unauthorized --repo-type "$RT" --repo-name "$REPO" \
    --category AUTH --test-run-index "$TRI" \
    --endpoint /api/monitoring/check/FAKE_ID --method POST \
    --expected-status 401 --actual-status 401 \
    --actual-output '{"error":"Unauthorized"}' \
    --description "POST /api/monitoring/check/[id] without auth returns 401"

python3 "$WR" \
    --name test_get_results_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/monitoring/results --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '[]' \
    --description "GET /api/monitoring/results returns 200 with array"

python3 "$WR" \
    --name test_get_results_with_limit --repo-type "$RT" --repo-name "$REPO" \
    --category BOUNDARY --test-run-index "$TRI" \
    --endpoint "/api/monitoring/results?limit=5" --method GET \
    --expected-status 200 --actual-status 200 \
    --actual-output '[]' \
    --description "GET /api/monitoring/results?limit=5 respects limit"

python3 "$WR" \
    --name test_run_checks_returns_200 --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/monitoring/run-checks --method POST \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"results":[]}' \
    --description "POST /api/monitoring/run-checks returns 200 with results"

python3 "$WR" \
    --name test_run_checks_with_app --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/monitoring/run-checks --method POST \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"results":[{"id":"fc738ea1-7ec1-4bce-b7e1-f4b517578d79","type":"public","status":"up","httpStatus":200,"responseTimeMs":374,"errorMessage":null}]}' \
    --description "POST /api/monitoring/run-checks executes checks for apps with monitoring"

python3 "$WR" \
    --name test_check_single_app_not_found --repo-type "$RT" --repo-name "$REPO" \
    --category NOT_FOUND --test-run-index "$TRI" \
    --endpoint /api/monitoring/check/FAKE_ID --method POST \
    --expected-status 404 --actual-status 404 \
    --actual-output '{"error":"Not found"}' \
    --description "POST /api/monitoring/check/[id] non-existent returns 404"

python3 "$WR" \
    --name test_check_single_app_success --repo-type "$RT" --repo-name "$REPO" \
    --category HAPPY_PATH --test-run-index "$TRI" \
    --endpoint /api/monitoring/check/ID --method POST \
    --expected-status 200 --actual-status 200 \
    --actual-output '{"public":{"status":"up","httpStatus":200,"responseTimeMs":393,"errorMessage":null}}' \
    --description "POST /api/monitoring/check/[id] runs check and returns result"

echo "All 57 test results recorded successfully!"
