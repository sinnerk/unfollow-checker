"""Unfollow Checker — account existence API.

Why this exists: Instagram only answers "does this profile still exist?" for a
signed-in visitor, so a purely client-side site cannot filter dead accounts for
everyone. This service holds one or more operator sessions (never a visitor's),
checks handles in batches, caches the answers, and is the only piece that talks
to Instagram.

Privacy: requests carry usernames only. No export, no visitor identity, no IPs
in the logs, and nothing about a visitor's account is ever stored.

    IG_SESSIONS="sessionid=...; csrftoken=...; ds_user_id=..." uvicorn app:app

Multiple sessions can be separated with ";;" and are used round-robin.
"""
from __future__ import annotations

import asyncio
import json
import os
import random
import sqlite3
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

APP_ID = "936619743392459"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
PROBE_URL = "https://www.instagram.com/api/v1/users/web_profile_info/?username={}"
CONTROL_ACCOUNT = "instagram"

ALIVE_TTL = 24 * 3600
DEAD_TTL = 12 * 3600
FAIL_TTL = 300

MAX_NAMES = 200
RATE_PER_MINUTE = int(os.environ.get("RATE_PER_MINUTE", "120"))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://sinnerk.github.io,https://unfollowchecker.is-a.dev,http://127.0.0.1:8765,http://localhost:8765",
    ).split(",")
    if origin.strip()
]

DB_PATH = Path(os.environ.get("CACHE_DB", "cache.sqlite3"))


def sessions() -> list[str]:
    raw = os.environ.get("IG_SESSIONS", "").strip()
    if not raw:
        return []
    return [chunk.strip() for chunk in raw.split(";;") if chunk.strip()]


# --------------------------------------------------------------------------
# cache
# --------------------------------------------------------------------------

def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.execute(
        "CREATE TABLE IF NOT EXISTS checks ("
        " username TEXT PRIMARY KEY,"
        " status TEXT NOT NULL,"
        " checked_at INTEGER NOT NULL)"
    )
    return con


def cache_get(con: sqlite3.Connection, username: str) -> tuple[str, int] | None:
    row = con.execute(
        "SELECT status, checked_at FROM checks WHERE username = ?", (username,)
    ).fetchone()
    if not row:
        return None
    status, checked_at = row
    ttl = {"alive": ALIVE_TTL, "dead": DEAD_TTL}.get(status, FAIL_TTL)
    if time.time() - checked_at > ttl:
        return None
    return status, checked_at


def cache_put(con: sqlite3.Connection, username: str, status: str) -> None:
    con.execute(
        "INSERT INTO checks (username, status, checked_at) VALUES (?, ?, ?) "
        "ON CONFLICT(username) DO UPDATE SET status = excluded.status, checked_at = excluded.checked_at",
        (username, status, int(time.time())),
    )
    con.commit()


# --------------------------------------------------------------------------
# rate limiting (in-memory, per client)
# --------------------------------------------------------------------------

HITS: dict[str, deque[float]] = defaultdict(deque)


def rate_ok(client: str) -> bool:
    now = time.time()
    window = HITS[client]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= RATE_PER_MINUTE:
        return False
    window.append(now)
    return True


# --------------------------------------------------------------------------
# Instagram probes
# --------------------------------------------------------------------------

class Prober:
    def __init__(self) -> None:
        self.sessions = sessions()
        self.next_index = 0
        self.control_ok: bool | None = None
        self.control_at = 0.0
        self.client = httpx.AsyncClient(timeout=25, follow_redirects=False)
        self.lock = asyncio.Lock()

    def _pick(self) -> str:
        self.next_index = (self.next_index + 1) % max(len(self.sessions), 1)
        return self.sessions[self.next_index % len(self.sessions)]

    async def probe(self, username: str) -> str:
        """alive | dead | ratelimit | unauthorized | fail"""
        if not self.sessions:
            return "no_session"
        cookie = self._pick()
        csrf = ""
        for part in cookie.split(";"):
            name, _, value = part.strip().partition("=")
            if name == "csrftoken":
                csrf = value
        headers = {
            "user-agent": UA,
            "x-ig-app-id": APP_ID,
            "x-csrftoken": csrf,
            "x-requested-with": "XMLHttpRequest",
            "accept": "*/*",
            "referer": f"https://www.instagram.com/{username}/",
            "cookie": cookie,
        }
        async with self.lock:
            await asyncio.sleep(0.6 + random.random() * 0.4)  # be gentle
            try:
                response = await self.client.get(PROBE_URL.format(username), headers=headers)
            except Exception:
                return "fail"

        if response.status_code == 404:
            return "dead"
        if response.status_code == 429:
            return "ratelimit"
        if response.status_code in (401, 403):
            return "unauthorized"
        if response.status_code != 200:
            return "fail"
        body = response.text
        if "checkpoint_required" in body or "challenge_required" in body:
            return "unauthorized"
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return "fail"
        payload = data.get("data") or {}
        if not isinstance(payload, dict):
            return "fail"
        user = payload.get("user")
        if isinstance(user, dict) and user.get("username"):
            return "alive"
        if "user" in payload:
            return "dead"
        return "fail"

    async def control(self) -> bool:
        if time.time() - self.control_at < 900 and self.control_ok is not None:
            return self.control_ok
        status = await self.probe(CONTROL_ACCOUNT)
        self.control_ok = status == "alive"
        self.control_at = time.time()
        return self.control_ok


PROBER = Prober()


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------

app = FastAPI(title="Unfollow Checker API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
    max_age=86400,
)


class CheckIn(BaseModel):
    usernames: list[str] = Field(default_factory=list)


def clean(name: str) -> str:
    name = (name or "").strip().lstrip("@").rstrip("/")
    if len(name) > 64 or not name.replace(".", "").replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail=f"invalid username: {name!r}")
    return name


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    con = db()
    total = con.execute("SELECT COUNT(*) FROM checks").fetchone()[0]
    con.close()
    return {
        "ok": True,
        "sessions": len(PROBER.sessions),
        "cache": total,
        "control": PROBER.control_ok,
    }


@app.post("/api/check")
async def check(payload: CheckIn, request: Request) -> JSONResponse:
    client = request.client.host if request.client else "?"
    if not rate_ok(client):
        return JSONResponse(
            status_code=429, content={"error": "rate_limited", "retryAfter": 30}
        )
    if not payload.usernames:
        raise HTTPException(status_code=400, detail="no usernames")
    if len(payload.usernames) > MAX_NAMES:
        raise HTTPException(status_code=400, detail=f"at most {MAX_NAMES} usernames per call")

    names: list[str] = []
    seen: set[str] = set()
    for raw in payload.usernames:
        name = clean(raw)
        key = name.lower()
        if key not in seen:
            seen.add(key)
            names.append(name)

    if not PROBER.sessions:
        return JSONResponse(
            status_code=503,
            content={"error": "no_session", "detail": "This server has no Instagram session configured."},
        )
    if not await PROBER.control():
        return JSONResponse(
            status_code=503,
            content={"error": "session_invalid", "detail": "The server session is not answering as a logged-in user."},
        )

    con = db()
    results: dict[str, dict[str, Any]] = {}
    pending: list[str] = []
    for name in names:
        cached = cache_get(con, name.lower())
        if cached:
            results[name] = {"status": cached[0], "checkedAt": cached[1], "cached": True}
        else:
            pending.append(name)
    con.close()

    live = 0
    for index, name in enumerate(pending):
        status = await PROBER.probe(name)
        attempts = 0
        while status == "ratelimit" and attempts < 2:
            attempts += 1
            await asyncio.sleep(6 * attempts)
            status = await PROBER.probe(name)
        if status == "unauthorized":
            return JSONResponse(
                status_code=503,
                content={"error": "session_invalid", "partial": results},
            )
        if status in ("alive", "dead"):
            con = db()
            cache_put(con, name.lower(), status)
            con.close()
            live += 1
        results[name] = {"status": status, "checkedAt": int(time.time()), "cached": False}
        if index % 20 == 0 and index:
            pass

    return JSONResponse({
        "results": results,
        "checked": len(results),
        "live": live,
        "cached": len(results) - live,
    })


@app.get("/api/check")
async def check_one(username: str, request: Request) -> JSONResponse:
    return await check(CheckIn(usernames=[username]), request)


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "name": "Unfollow Checker API",
        "usage": "POST /api/check {\"usernames\": [\"a\", \"b\"]}",
        "limits": {"maxNames": MAX_NAMES, "perMinute": RATE_PER_MINUTE},
    }
