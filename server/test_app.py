"""API tests — no network, no real Instagram session.

Run: python -m pytest server -q     (or: python server/test_app.py)
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

os.environ.setdefault("CACHE_DB", str(Path(tempfile.gettempdir()) / "uc_api_test.sqlite3"))
os.environ["IG_SESSIONS"] = "sessionid=fake; csrftoken=abc; ds_user_id=1"
os.environ["RATE_PER_MINUTE"] = "1000"

import app as service  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(service.app)


def fake_probe_factory(mapping: dict[str, str]):
    async def fake_probe(username: str) -> str:
        return mapping.get(username.lower(), "alive")

    return fake_probe


def reset_cache() -> None:
    if service.DB_PATH.exists():
        service.DB_PATH.unlink()


def test_healthz() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["sessions"] == 1


def test_classifies_dead_and_alive() -> None:
    reset_cache()
    service.PROBER.control_ok = True
    service.PROBER.control_at = 10**12  # far future: skip the live control probe
    service.PROBER.probe = fake_probe_factory({"ghost": "dead", "real": "alive"})  # type: ignore[method-assign]

    response = client.post("/api/check", json={"usernames": ["ghost", "real"]})
    assert response.status_code == 200
    results = response.json()["results"]
    assert results["ghost"]["status"] == "dead"
    assert results["real"]["status"] == "alive"
    assert results["ghost"]["cached"] is False


def test_second_call_is_served_from_cache() -> None:
    reset_cache()
    service.PROBER.control_ok = True
    service.PROBER.control_at = 10**12
    service.PROBER.probe = fake_probe_factory({"ghost": "dead"})  # type: ignore[method-assign]

    client.post("/api/check", json={"usernames": ["ghost"]})
    second = client.post("/api/check", json={"usernames": ["ghost"]}).json()
    assert second["results"]["ghost"]["cached"] is True
    assert second["live"] == 0


def test_deduplicates_case_insensitively() -> None:
    reset_cache()
    service.PROBER.control_ok = True
    service.PROBER.control_at = 10**12
    calls: list[str] = []

    async def counting_probe(username: str) -> str:
        calls.append(username)
        return "alive"

    service.PROBER.probe = counting_probe  # type: ignore[method-assign]
    body = client.post("/api/check", json={"usernames": ["Alice", "alice", "ALICE"]}).json()
    assert body["checked"] == 1
    assert calls == ["Alice"]


def test_rejects_bad_usernames() -> None:
    response = client.post("/api/check", json={"usernames": ["no spaces here"]})
    assert response.status_code == 400


def test_rejects_oversized_batches() -> None:
    response = client.post("/api/check", json={"usernames": [f"user{i}" for i in range(201)]})
    assert response.status_code == 400


def test_no_session_is_503(monkeypatch) -> None:
    monkeypatch.setattr(service.PROBER, "sessions", [])
    response = client.post("/api/check", json={"usernames": ["alice"]})
    assert response.status_code == 503
    assert response.json()["error"] == "no_session"


def test_invalid_session_is_503(monkeypatch) -> None:
    monkeypatch.setattr(service.PROBER, "sessions", ["sessionid=x"])
    service.PROBER.control_ok = False
    service.PROBER.control_at = 10**12
    response = client.post("/api/check", json={"usernames": ["alice"]})
    assert response.status_code == 503
    assert response.json()["error"] == "session_invalid"


def test_unauthorized_midway_stops(monkeypatch) -> None:
    reset_cache()
    monkeypatch.setattr(service.PROBER, "sessions", ["sessionid=x"])
    service.PROBER.control_ok = True
    service.PROBER.control_at = 10**12
    service.PROBER.probe = fake_probe_factory({"unauth_user": "unauthorized"})  # type: ignore[method-assign]
    response = client.post("/api/check", json={"usernames": ["unauth_user"]})
    assert response.status_code == 503
