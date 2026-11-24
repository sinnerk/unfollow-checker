# Checker API

One job: answer "does this Instagram account still exist?" for a list of handles.
It exists because Instagram answers that question only for a signed-in visitor,
so a static site can't do it for everyone on its own.

Nothing about a visitor is stored — requests carry handles, and the cache is
`handle -> exists`, with no IPs and no per-visitor rows.

## Two builds, same contract

| File | Runtime | Free tier |
| --- | --- | --- |
| `app.py` | FastAPI (Docker, Railway, Fly, any VPS) | Railway trial, then ~$5/mo |
| `worker.js` | Cloudflare Worker | 100k requests/day, no card |

```
POST /api/check   {"usernames": ["a","b"]}   ->  {"results": {"a": {"status": "alive"}}}
GET  /api/check?username=a                   ->  same, single handle
GET  /healthz                                ->  {"ok": true, "sessions": 1}
```

`status` is `alive`, `dead`, `fail` (unknown), or the whole call returns
`503 {"error": "no_session" | "session_invalid"}` when the operator sessions are
missing or rejected. A control probe of `@instagram` runs before any batch, so a
broken session can never mark real accounts as gone.

Limits: 200 handles per request, 120/minute per client on the Python build
(tunable with `RATE_PER_MINUTE`), answers cached 24 h (alive) / 12 h (dead).

## Configure the session

The service needs at least one *operator* Instagram session — a cookie header
string, not a password:

```
IG_SESSIONS="sessionid=...; csrftoken=...; ds_user_id=...; mid=..."
```

Multiple sessions are separated with `;;` and used round-robin. Treat this like
a password: it grants full access to that account. Use a **throwaway account**,
never a personal main, because a public checker can get it rate-limited or
challenged.

## Deploy: Cloudflare Worker (free, no card)

```bash
cd server
npx wrangler login                      # one browser click
npx wrangler kv namespace create CACHE  # optional but recommended
npx wrangler secret put IG_SESSIONS     # paste the cookie string
npx wrangler deploy
```

Add the KV id it prints to `wrangler.toml`, then put the worker URL into
`API_BASE` in `docs/js/app.js` (or pass `?api=https://...` to the site for
testing).

## Deploy: Railway / Docker

`server.railway.json` at the repo root points Railway at `server/Dockerfile`.

```bash
railway login
railway init
railway up
railway variables --set IG_SESSIONS="sessionid=...; csrftoken=..." --set ALLOWED_ORIGINS="https://sinnerk.github.io,https://unfollowchecker.is-a.dev"
railway domain
```

## Tests

```bash
python -m pytest server -q      # 9 tests, no network, no real session
```

## Reality check

Datacenter IPs are a hostile place to talk to Instagram: expect 429s and
`checkpoint_required` challenges on a fresh session from a cloud host. Mitigate
by (1) using a fresh throwaway account, (2) caching aggressively, (3) keeping the
browser-side bookmarklet as the fallback path — it always works because it runs
on the user's own session and IP.
