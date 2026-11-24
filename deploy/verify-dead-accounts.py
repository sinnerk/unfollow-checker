#!/usr/bin/env python3
"""Mark dead / deactivated Instagram accounts, using your own logged-in session.

Instagram only answers "does this profile exist?" for a signed-in visitor, and
the browser holds that session. So this script waits until Brave is closed,
reads the (unlocked) cookie store, and asks Instagram's own web API about every
account in your "not following back" list — one request per second, no writes.

The session cookie stays in memory: it is never logged, printed, or saved.
Output: deploy/dead-accounts.json  ->  {dead: [...], alive: [...], failed: [...]}

Usage:
    python deploy/verify-dead-accounts.py "<export.zip>" [--wait 600]
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

USER_DATA = Path(os.environ["LOCALAPPDATA"]) / "BraveSoftware/Brave-Browser/User Data"
BRAVE_EXE = Path(r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe")
APP_ID = "936619743392459"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
HERE = Path(__file__).resolve().parent
OUT = HERE / "dead-accounts.json"


# --------------------------------------------------------------------------
# session
# --------------------------------------------------------------------------

def brave_running() -> bool:
    try:
        out = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq brave.exe", "/NH"],
            capture_output=True, text=True, timeout=20,
        ).stdout
    except Exception:
        return False
    return "brave.exe" in out.lower()


def wait_for_brave_to_close(seconds: int) -> None:
    deadline = time.time() + seconds
    announced = False
    while brave_running():
        if not announced:
            print(f"waiting up to {seconds}s for Brave to close…", flush=True)
            announced = True
        if time.time() > deadline:
            raise SystemExit("Brave is still open — close it and run this again.")
        time.sleep(3)
    time.sleep(2)  # let file handles drop


def dpapi_unprotect(blob: bytes) -> bytes:
    import ctypes
    from ctypes import wintypes

    class DATA_BLOB(ctypes.Structure):
        _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]

    buf = ctypes.create_string_buffer(blob, len(blob))
    blob_in = DATA_BLOB(len(blob), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char)))
    blob_out = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)
    ):
        raise OSError("CryptUnprotectData failed")
    data = ctypes.string_at(blob_out.pbData, blob_out.cbData)
    ctypes.windll.kernel32.LocalFree(blob_out.pbData)
    return data


def read_cookies() -> dict[str, str]:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    state = json.loads((USER_DATA / "Local State").read_text(encoding="utf-8"))
    enc_key = base64.b64decode(state["os_crypt"]["encrypted_key"])
    aes_key = dpapi_unprotect(enc_key[5:])  # strip "DPAPI"

    src = USER_DATA / "Default/Network/Cookies"
    with tempfile.NamedTemporaryFile(delete=False, suffix=".sqlite") as tmp:
        path = tmp.name
    shutil.copyfile(src, path)
    try:
        con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        rows = con.execute(
            "SELECT name, encrypted_value, value FROM cookies "
            "WHERE host_key LIKE '%instagram%' ORDER BY name"
        ).fetchall()
        con.close()
    finally:
        os.unlink(path)

    cookies: dict[str, str] = {}
    for name, enc, plain in rows:
        if plain:
            cookies[name] = plain
            continue
        if enc[:3] not in (b"v10", b"v11"):
            continue  # v20 is app-bound: cannot be read outside the browser
        try:
            value = AESGCM(aes_key).decrypt(enc[3:15], enc[15:], None).decode("utf-8")
        except Exception:
            continue
        cookies[name] = value
    return cookies


# --------------------------------------------------------------------------
# export
# --------------------------------------------------------------------------

def not_following_back(zip_path: Path) -> list[str]:
    sys.path.insert(0, str(HERE.parent))
    import ig_audit  # noqa: E402  (local module)

    following, followers = ig_audit.load_follow_lists(zip_path)
    return sorted(
        (account["username"] for key, account in following.items() if key not in followers),
        key=str.lower,
    )


# --------------------------------------------------------------------------
# check
# --------------------------------------------------------------------------

def probe(username: str, cookies: dict[str, str]) -> str:
    url = (
        "https://www.instagram.com/api/v1/users/web_profile_info/?username="
        + urllib.parse.quote(username)
    )
    header_cookie = "; ".join(f"{k}={v}" for k, v in cookies.items()
                              if k in ("sessionid", "csrftoken", "ds_user_id", "mid", "ig_did"))
    request = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "x-ig-app-id": APP_ID,
        "x-csrftoken": cookies.get("csrftoken", ""),
        "x-requested-with": "XMLHttpRequest",
        "accept": "*/*",
        "referer": f"https://www.instagram.com/{username}/",
        "cookie": header_cookie,
    })
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = response.read().decode("utf-8", "replace")
            if response.status == 200:
                try:
                    data = json.loads(body)
                except json.JSONDecodeError:
                    return "fail"
                user = (data.get("data") or {}).get("user")
                if user and user.get("username"):
                    return "alive"
                if "user" in (data.get("data") or {}):
                    return "dead"
                return "fail"
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return "dead"
        if error.code == 429:
            return "ratelimit"
        if error.code in (401, 403):
            return "unauthorized"
        return "fail"
    except Exception:
        return "fail"
    return "fail"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("export", help="path to the Instagram export .zip")
    parser.add_argument("--wait", type=int, default=900, help="seconds to wait for Brave to close")
    parser.add_argument("--limit", type=int, default=0, help="only check the first N accounts")
    args = parser.parse_args()

    accounts = not_following_back(Path(args.export))
    if args.limit:
        accounts = accounts[: args.limit]
    print(f"{len(accounts)} accounts to check")

    wait_for_brave_to_close(args.wait)
    cookies = read_cookies()
    if "sessionid" not in cookies:
        raise SystemExit(
            "No Instagram session found in Brave. Log in at instagram.com first.\n"
            f"(cookie names seen: {', '.join(sorted(cookies)) or 'none'})"
        )
    print("session loaded from Brave (in memory only)")

    dead: list[str] = []
    alive: list[str] = []
    failed: list[str] = []
    started = time.time()

    # Control: if the official account does not answer, the session is not valid
    # and nothing should be marked dead.
    control = probe("instagram", cookies)
    if control != "alive":
        raise SystemExit(f"Session check failed ({control}). Log in to Instagram in Brave and retry.")

    for index, username in enumerate(accounts, start=1):
        result = probe(username, cookies)
        attempts = 0
        while result == "ratelimit" and attempts < 3:
            attempts += 1
            time.sleep(10 * attempts)
            result = probe(username, cookies)
        if result == "unauthorized":
            raise SystemExit("Instagram rejected the session (401/403). Log in again in Brave.")
        if result == "dead":
            dead.append(username)
        elif result == "alive":
            alive.append(username)
        else:
            failed.append(username)
        if index % 10 == 0 or index == len(accounts):
            elapsed = time.time() - started
            print(
                f"{index}/{len(accounts)}  gone={len(dead)}  exists={len(alive)}  "
                f"failed={len(failed)}  {elapsed:.0f}s",
                flush=True,
            )
        time.sleep(1.0)

    payload = {"dead": dead, "alive": alive, "failed": failed,
               "checked": len(accounts), "when": int(time.time() * 1000)}
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\n{len(dead)} gone, {len(alive)} exist, {len(failed)} failed")
    print(f"written to {OUT}")

    fragment = base64.b64encode(json.dumps(payload).encode()).decode()
    print("\napply it in the browser (open while the tool tab has your export):")
    print(f"https://sinnerk.github.io/local-instagram-unfollower/app.html#verify={fragment}")

    if BRAVE_EXE.exists():
        subprocess.Popen([str(BRAVE_EXE), "--restore-last-session"], close_fds=True)
        print("Brave reopened.")


if __name__ == "__main__":
    main()
