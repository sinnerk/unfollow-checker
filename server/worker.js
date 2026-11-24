/**
 * Unfollow Checker API — Cloudflare Worker edition.
 *
 * Same contract as server/app.py, but it runs on Cloudflare's free tier:
 *
 *   POST /api/check  {"usernames": ["a","b"]}  ->  {results: {a: {status}}}
 *   GET  /healthz
 *
 * Deploy:
 *   npx wrangler login                      # one browser click
 *   npx wrangler secret put IG_SESSIONS     # paste: sessionid=...; csrftoken=...; ds_user_id=...
 *   npx wrangler deploy
 *
 * The session cookie is a secret binding; it is never returned to a client and
 * never written to a log.
 */

const APP_ID = "936619743392459";
const CONTROL = "instagram";
const ALIVE_TTL = 24 * 3600;
const DEAD_TTL = 12 * 3600;
const MAX_NAMES = 200;

const ALLOWED = [
  "https://sinnerk.github.io",
  "https://unfollowchecker.is-a.dev",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
];

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const extra = (env.EXTRA_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = ALLOWED.includes(origin) || extra.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "content-type": "application/json",
  };
}

const json = (body, status, request, env) =>
  new Response(JSON.stringify(body), { status, headers: cors(request, env) });

function csrfOf(cookie) {
  const match = /csrftoken=([^;]+)/.exec(cookie || "");
  return match ? match[1] : "";
}

async function probe(username, env) {
  if (!env.IG_SESSIONS) return "no_session";
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "x-ig-app-id": APP_ID,
    "x-csrftoken": csrfOf(env.IG_SESSIONS),
    "x-requested-with": "XMLHttpRequest",
    accept: "*/*",
    referer: `https://www.instagram.com/${username}/`,
    cookie: env.IG_SESSIONS,
  };
  let response;
  try {
    response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { headers, redirect: "manual" },
    );
  } catch {
    return "fail";
  }
  if (response.status === 404) return "dead";
  if (response.status === 429) return "ratelimit";
  if (response.status === 401 || response.status === 403) return "unauthorized";
  if (response.status !== 200) return "fail";
  const text = await response.text();
  if (text.includes("checkpoint_required") || text.includes("challenge_required")) return "unauthorized";
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return "fail";
  }
  const payload = (data && data.data) || {};
  const user = payload.user;
  if (user && user.username) return "alive";
  if ("user" in payload) return "dead";
  return "fail";
}

async function cached(username, env) {
  if (!env.CACHE) return null;
  const row = await env.CACHE.get(`u:${username.toLowerCase()}`, "json");
  if (!row) return null;
  const ttl = row.status === "alive" ? ALIVE_TTL : DEAD_TTL;
  if (Date.now() / 1000 - row.at > ttl) return null;
  return row.status;
}

async function remember(username, status, env) {
  if (!env.CACHE) return;
  await env.CACHE.put(
    `u:${username.toLowerCase()}`,
    JSON.stringify({ status, at: Math.floor(Date.now() / 1000) }),
    { expirationTtl: ALIVE_TTL },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request, env) });

    if (url.pathname === "/healthz") {
      return json({ ok: true, sessions: env.IG_SESSIONS ? 1 : 0, cache: !!env.CACHE }, 200, request, env);
    }

    if (url.pathname !== "/api/check") {
      return json({ error: "not_found", usage: 'POST /api/check {"usernames":[...]}' }, 404, request, env);
    }

    let names;
    if (request.method === "GET") {
      names = [url.searchParams.get("username") || ""];
    } else {
      const body = await request.json().catch(() => null);
      names = (body && body.usernames) || [];
    }
    if (!Array.isArray(names) || !names.length) return json({ error: "no_usernames" }, 400, request, env);
    if (names.length > MAX_NAMES) return json({ error: "too_many", max: MAX_NAMES }, 400, request, env);

    const unique = [];
    const seen = new Set();
    for (const raw of names) {
      const name = String(raw).trim().replace(/^@+/, "").replace(/\/+$/, "");
      if (!/^[A-Za-z0-9._]{1,64}$/.test(name)) return json({ error: "invalid_username", name }, 400, request, env);
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        unique.push(name);
      }
    }

    if (!env.IG_SESSIONS) return json({ error: "no_session" }, 503, request, env);

    const control = await probe(CONTROL, env);
    if (control !== "alive") return json({ error: "session_invalid", control }, 503, request, env);

    const results = {};
    let live = 0;
    for (const name of unique) {
      const hit = await cached(name, env);
      if (hit) {
        results[name] = { status: hit, cached: true };
        continue;
      }
      let status = await probe(name, env);
      let attempts = 0;
      while (status === "ratelimit" && attempts < 2) {
        attempts += 1;
        await new Promise((r) => setTimeout(r, 4000 * attempts));
        status = await probe(name, env);
      }
      if (status === "unauthorized") return json({ error: "session_invalid", partial: results }, 503, request, env);
      if (status === "alive" || status === "dead") await remember(name, status, env);
      results[name] = { status, cached: false };
      live += 1;
      await new Promise((r) => setTimeout(r, 500)); // stay gentle
    }

    return json({ results, checked: unique.length, live, cached: unique.length - live }, 200, request, env);
  },
};
