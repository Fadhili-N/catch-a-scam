"""HTTP-layer tests: does the right status code come back, independent of
Supabase. get_client/analyze_report are both faked, same reasoning as
test_matching.py — this file is testing the endpoint's auth and wiring,
not the analysis logic itself (test_matching.py already covers that).
"""

from fastapi.testclient import TestClient

import app.main as main


def test_health_needs_no_auth():
    client = TestClient(main.app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_rejects_missing_secret():
    client = TestClient(main.app)
    response = client.post("/internal/reports/some-id/analyze")
    assert response.status_code == 401


def test_analyze_rejects_wrong_secret():
    client = TestClient(main.app)
    response = client.post(
        "/internal/reports/some-id/analyze", headers={"X-Internal-Secret": "wrong-value"}
    )
    assert response.status_code == 401


def test_analyze_accepts_correct_secret(monkeypatch):
    monkeypatch.setattr(main, "get_client", lambda: object())
    monkeypatch.setattr(main, "analyze_report", lambda client, report_id: {"report_id": report_id, "hashed": [], "matches_found": []})

    client = TestClient(main.app)
    response = client.post(
        "/internal/reports/some-id/analyze", headers={"X-Internal-Secret": "test-internal-secret"}
    )
    assert response.status_code == 200
    assert response.json()["report_id"] == "some-id"


def test_analyze_turns_an_internal_error_into_a_500_not_a_crash(monkeypatch):
    def boom(client, report_id):
        raise ValueError("storage download failed")

    monkeypatch.setattr(main, "get_client", lambda: object())
    monkeypatch.setattr(main, "analyze_report", boom)

    client = TestClient(main.app)
    response = client.post(
        "/internal/reports/some-id/analyze", headers={"X-Internal-Secret": "test-internal-secret"}
    )
    assert response.status_code == 500
