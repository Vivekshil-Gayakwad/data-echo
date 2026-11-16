import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from app import app, init_db

init_db()
client = app.test_client()

print("--- Testing Unified Production Server & Static SPA Serving ---")

# 1. Health check
res_health = client.get("/api/health")
print(f"1. Health Check: {res_health.status_code}")
assert res_health.status_code == 200
data = res_health.get_json()
print("   Payload:", data)
assert data["frontend_served"] is True, "Frontend dist folder must be served!"

# 2. Frontend Root Route
res_root = client.get("/")
print(f"2. GET /: {res_root.status_code}, Length: {len(res_root.data)}")
assert res_root.status_code == 200
assert b'id="root"' in res_root.data or b"<div id=\"root\"" in res_root.data

# 3. SPA Route Fallback (/verify, /source-propagation, /what-if)
for path in ["/verify", "/source-propagation", "/what-if", "/login", "/register"]:
    res_spa = client.get(path)
    print(f"3. SPA Route GET {path}: {res_spa.status_code}")
    assert res_spa.status_code == 200
    assert b"<html" in res_spa.data

# 4. Unknown API endpoint returns 404 JSON, not HTML
res_404 = client.get("/api/nonexistent")
print(f"4. API 404 Route GET /api/nonexistent: {res_404.status_code}")
assert res_404.status_code == 404
assert res_404.get_json() == {"error": "Endpoint not found"}

# 5. Live verification endpoint
res_verify_api = client.post("/api/verify", json={"claim": "New PM scholarship portal launched"})
print(f"5. API Verify POST: {res_verify_api.status_code}")
assert res_verify_api.status_code == 200
ver_data = res_verify_api.get_json()
earliest_src = ver_data.get("source_audit", {}).get("earliest_source") or "Origin Unknown"
print(f"   Verdict: {ver_data['verdict']}, Earliest Source: {earliest_src}")

print("\nAll production server verification tests PASSED!")
