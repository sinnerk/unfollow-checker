/**
 * Instagram export parser — browser edition.
 *
 * This is a direct port of ig_audit.py's parsing layer so the website and the
 * desktop tool always agree on the numbers. Everything runs in memory: the
 * export never touches a network.
 *
 * Input: an array of { path, text } pairs, one per file in the export
 * (path is the path inside the zip).
 * Output: { following, followers, info, stats, notFollowingBack, fans, mutual }
 */

const USERNAME_RE = /^[A-Za-z0-9._]{1,64}$/;
const TAG_RE = /<[^>]+>/g;
const HTML_ANCHOR_RE =
  /<a[^>]*href="(?<href>https?:\/\/(?:www\.)?instagram\.com\/[^"]*)"[^>]*>(?<label>.*?)<\/a>/gis;
const HTML_DATE_RE = /<\/div><div>\s*([^<]{3,40}?)\s*<\/div>/;
const INSIGHTS_SUFFIX = "past_instagram_insights/audience_insights.html";
const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const fold = (value) => value.toLowerCase();

/* ------------------------------------------------------------------ */
/* Field normalisation                                                 */
/* ------------------------------------------------------------------ */

export function cleanUsername(value) {
  if (typeof value !== "string") return null;
  value = value.trim();
  if (!value) return null;

  if (value.toLowerCase().includes("instagram.com")) {
    let url = value;
    if (!url.includes("://")) url = "https://" + url;
    let parts;
    try {
      parts = new URL(url).pathname.split("/").filter(Boolean);
    } catch {
      return null;
    }
    if (!parts.length) return null;
    let segment;
    if (parts[0] === "_u" && parts.length > 1) segment = parts[1];
    else segment = parts[0];
    try {
      value = decodeURIComponent(segment);
    } catch {
      value = segment;
    }
  }

  value = value.trim().replace(/^@+/, "").replace(/\/+$/, "");
  if (!value || !USERNAME_RE.test(value)) return null;
  return value;
}

export function normalizeTimestamp(value) {
  if (typeof value === "boolean") return null;
  const timestamp = Number.parseInt(value, 10);
  if (!Number.isFinite(timestamp)) return null;
  let ts = timestamp;
  if (ts > 1e12) ts = Math.floor(ts / 1000);
  if (ts <= 0) return null;
  return ts;
}

/** Collapse repeated handles inside one record, keeping the newest date. */
function mergeEntries(entries) {
  const merged = new Map();
  for (const [username, timestamp] of entries) {
    const key = fold(username);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, [username, timestamp]);
      continue;
    }
    if (timestamp != null && (existing[1] == null || timestamp > existing[1])) {
      merged.set(key, [existing[0], timestamp]);
    }
  }
  return [...merged.values()];
}

export function extractEntries(record) {
  const found = [];
  const add = (value, timestamp) => {
    const username = cleanUsername(value);
    if (username) found.push([username, normalizeTimestamp(timestamp)]);
  };

  if (typeof record === "string") {
    add(record);
    return mergeEntries(found);
  }
  if (!record || typeof record !== "object") return mergeEntries(found);

  const recordTs = normalizeTimestamp(record.timestamp);

  for (const key of ["value", "username"]) {
    if (key in record) add(record[key], recordTs);
  }
  if ("href" in record) add(record.href, recordTs);

  const stringList = record.string_list_data;
  if (Array.isArray(stringList)) {
    for (const item of stringList) {
      if (item && typeof item === "object") {
        const itemTs = normalizeTimestamp(item.timestamp) ?? recordTs;
        for (const key of ["value", "username"]) {
          if (key in item) add(item[key], itemTs);
        }
        if ("href" in item) add(item.href, itemTs);
        if ("title" in item) add(item.title, itemTs);
      } else if (typeof item === "string") {
        add(item, recordTs);
      }
    }
  }

  if (!found.length) {
    add(record.title, recordTs);
    add(record.href, recordTs);
  }

  return mergeEntries(found);
}

export function extractSections(data) {
  if (Array.isArray(data)) return [[null, data]];
  if (!data || typeof data !== "object") return [];

  const sections = [];
  for (const key of ["relationships_following", "relationships_followers"]) {
    if (Array.isArray(data[key])) sections.push([key, data[key]]);
  }
  if (sections.length) return sections;

  for (const key of ["relationships", "data", "items"]) {
    if (Array.isArray(data[key])) return [[key, data[key]]];
  }

  if (["string_list_data", "title", "value", "username"].some((k) => k in data)) {
    return [[null, [data]]];
  }
  return [];
}

export function kindFromFilename(name) {
  const base = String(name).replace(/\\/g, "/").split("/").pop().toLowerCase();
  const hasFollowing = base.includes("following");
  const hasFollowers = base.includes("followers");
  if (hasFollowing && !hasFollowers) return "following";
  if (hasFollowers && !hasFollowing) return "followers";
  return null;
}

/* ------------------------------------------------------------------ */
/* HTML-format exports                                                 */
/* ------------------------------------------------------------------ */

const unescapeHtml = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");

export function parseHtmlTimestamp(raw) {
  if (!raw) return null;
  const text = raw.split(/\s+/).filter(Boolean).join(" ");
  // "Nov 18, 2026 11:11 am" / "Nov 18, 2026 11:11am"
  let m = /^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2})\s*([ap]m)$/i.exec(text);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month === undefined) return null;
    let hour = Number.parseInt(m[4], 10) % 12;
    if (m[6].toLowerCase() === "pm") hour += 12;
    return Math.floor(
      Date.UTC(Number(m[3]), month, Number(m[2]), hour, Number(m[5])) / 1000,
    );
  }
  // "2026-11-18 11:11:11"
  m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(text);
  if (m) {
    return Math.floor(
      Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000,
    );
  }
  return null;
}

export function extractHtmlEntries(text) {
  const entries = [];
  // Reset lastIndex for safety on a shared regex.
  HTML_ANCHOR_RE.lastIndex = 0;
  let match;
  while ((match = HTML_ANCHOR_RE.exec(text)) !== null) {
    const username = cleanUsername(match.groups.href);
    if (!username) continue;
    const label = unescapeHtml(match.groups.label.replace(TAG_RE, "")).trim();
    const labelUser = label ? cleanUsername(label) : null;
    if (!labelUser || fold(labelUser) !== fold(username)) continue;
    const windowText = text.slice(match.index + match[0].length, match.index + match[0].length + 200);
    const stamp = HTML_DATE_RE.exec(windowText);
    entries.push([username, stamp ? parseHtmlTimestamp(stamp[1]) : null]);
  }
  return entries;
}

function isRelationshipPage(name) {
  const normalized = String(name).replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("threads")) return false;
  const base = normalized.split("/").pop();
  return base.startsWith("followers") || base.startsWith("following");
}

export function parseReportedFollowerCount(html) {
  if (!html) return null;
  const stripped = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const text = unescapeHtml(stripped.replace(TAG_RE, " ")).split(/\s+/).filter(Boolean).join(" ");
  const m = /\bFollowers\s+([\d,]{1,15})/.exec(text);
  if (!m) return null;
  const value = Number.parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

function remember(store, username, timestamp) {
  const key = fold(username);
  const existing = store.get(key);
  if (!existing) {
    store.set(key, { username, timestamp: timestamp ?? null });
    return;
  }
  if (timestamp && (!existing.timestamp || timestamp > existing.timestamp)) {
    existing.timestamp = timestamp;
  }
}

/**
 * @param {{path: string, text: string}[]} files
 */
export function analyzeExport(files) {
  const following = new Map();
  const followers = new Map();
  const jsonKinds = new Set();
  const htmlKinds = new Set();
  const sources = [];
  let rowsRead = 0;
  let rowsSkipped = 0;
  let duplicates = 0;
  let missingDates = 0;
  let insightsHtml = null;

  let jsonFiles = 0;
  let htmlFiles = 0;

  const ingest = (kind, entries, source) => {
    const target = kind === "following" ? following : followers;
    const before = target.size;
    for (const [username, timestamp] of entries) {
      if (timestamp == null) missingDates += 1;
      remember(target, username, timestamp);
    }
    rowsRead += entries.length;
    duplicates += entries.length - (target.size - before);
    sources.push({ file: source, kind, rows: entries.length });
  };

  for (const file of files) {
    const path = String(file.path || "");
    const lower = path.toLowerCase();
    if (lower.endsWith(INSIGHTS_SUFFIX)) {
      insightsHtml = file.text;
      continue;
    }

    if (lower.endsWith(".json")) {
      // Threads and messaging folders carry same-named following.json files
      // that are not the social graph — never ingest those.
      if (lower.includes("/threads/") || lower.includes("\\threads\\")) continue;
      let data;
      try {
        data = JSON.parse(String(file.text).replace(/^\uFEFF/, ""));
      } catch {
        continue;
      }
      jsonFiles += 1;
      const filenameKind = kindFromFilename(path);
      for (const [section, records] of extractSections(data)) {
        const kind =
          section === "relationships_following"
            ? "following"
            : section === "relationships_followers"
              ? "followers"
              : filenameKind;
        if (kind !== "following" && kind !== "followers") continue;
        jsonKinds.add(kind);
        const entries = [];
        for (const record of records) {
          const found = extractEntries(record);
          if (!found.length) rowsSkipped += 1;
          for (const entry of found) entries.push(entry);
        }
        ingest(kind, entries, path);
      }
      continue;
    }

    if (lower.endsWith(".html") && isRelationshipPage(path)) {
      htmlFiles += 1;
      const kind = kindFromFilename(path);
      if (kind !== "following" && kind !== "followers") continue;
      htmlKinds.add(kind);
      ingest(kind, extractHtmlEntries(String(file.text)), path);
    }
  }

  const foundKinds = new Set([...jsonKinds, ...htmlKinds]);
  if (foundKinds.size === 0) {
    throw new Error(
      "No follower or following list was found in this export. In Accounts Center, " +
        "choose \"Download your information\" and make sure both Followers and " +
        "following are selected, in JSON format.",
    );
  }
  if (!foundKinds.has("following") || !foundKinds.has("followers")) {
    const missing = foundKinds.has("following") ? "followers" : "following";
    throw new Error(
      "Could not find the " + missing + " list in this export. Make sure you selected " +
        "both Followers and following when you requested your information.",
    );
  }

  const formats = [];
  if (jsonKinds.size) formats.push("json");
  if (htmlKinds.size) formats.push("html");

  const info = {
    format: formats.length > 1 ? "mixed" : formats[0],
    truncation: null,
    warnings: [],
    integrity: {},
  };

  if (htmlKinds.size) {
    info.warnings.push(
      "This export is HTML. Instagram leaves older entries out of long HTML lists, " +
        "so a follower list can be incomplete even when the file looks complete. " +
        "The JSON export lists every account.",
    );
  }

  const reported = parseReportedFollowerCount(insightsHtml || "");
  if (reported && followers.size && followers.size < reported) {
    const missing = reported - followers.size;
    if (missing >= Math.max(25, Math.floor(reported * 0.02))) {
      info.truncation = {
        reportedFollowers: reported,
        listedFollowers: followers.size,
        missing,
      };
      info.warnings.unshift(
        "Instagram reports " + reported.toLocaleString() + " followers, but this export " +
          "only lists " + followers.size.toLocaleString() + " of them, so about " +
          missing.toLocaleString() + " are missing. Anyone you follow who follows you " +
          "but is absent from that list will show up below as \"not following back\". " +
          "Treat this list as a superset, or re-download the export in JSON format for " +
          "an exact answer.",
      );
    }
  }

  info.integrity = {
    sources,
    rowsRead,
    rowsSkipped,
    duplicates,
    missingTimestamps: missingDates,
    followers: followers.size,
    following: following.size,
    reportedFollowers: reported || null,
    complete: !info.truncation,
    filesRead: jsonFiles + htmlFiles,
  };

  if (rowsSkipped) {
    info.warnings.push(
      rowsSkipped.toLocaleString() + " row(s) in the export could not be read as an " +
        "account and were ignored. That is unusual; please report it with your export.",
    );
  }

  const byName = (a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase());
  const followingArr = [...following.values()].sort(byName);
  const followerArr = [...followers.values()].sort(byName);

  const notFollowingBack = [...following.entries()]
    .filter(([key]) => !followers.has(key))
    .map(([, value]) => value)
    .sort(byName);
  const fans = [...followers.entries()]
    .filter(([key]) => !following.has(key))
    .map(([, value]) => value)
    .sort(byName);
  const mutual = [...following.entries()]
    .filter(([key]) => followers.has(key))
    .map(([, value]) => value)
    .sort(byName);

  return {
    following: followingArr,
    followers: followerArr,
    info,
    stats: {
      following: following.size,
      followers: followers.size,
      notFollowingBack: notFollowingBack.length,
      fans: fans.length,
      mutual: mutual.length,
    },
    notFollowingBack,
    fans,
    mutual,
  };
}

/** Stable fingerprint so check-offs stay attached to one export. */
export async function fingerprintOf(files, result) {
  const parts = [
    String(result.info.integrity.following),
    String(result.info.integrity.followers),
    String(result.info.integrity.rowsRead),
  ];
  const names = result.following.slice(0, 40).map((a) => a.username).join(",");
  const payload = parts.join("|") + "|" + names + "|" + result.followers.length;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);
  }
  // Fallback: cheap non-crypto hash (older browsers / insecure contexts).
  let h1 = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    h1 ^= payload.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return h1.toString(16).padStart(8, "0");
}
