/**
 * Unfollow Checker — browser app.
 *
 * Everything happens locally: JSZip reads the export in memory, parse.js does
 * the reconciliation, and progress is stored under a fingerprint of the export.
 */

import { analyzeExport, computeDiff, fingerprintOf } from "./parse.js";

const STATE_VERSION = "uc.v1";
const PAGE_SIZE = 150;
const SITE_URL = location.origin + location.pathname.replace(/[^/]*$/, "");
// UI strings come from js/i18n.js (loaded before this module). Missing keys
// fall back to the English text inside i18n.js itself.
const T = (key, params) => (window.ucT ? window.ucT(key, params) : key);

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2), value);
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
};

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */

let result = null;
let fingerprint = "";
let state = { handled: new Set(), gone: new Set(), alive: new Set() };
let activeView = "notFollowingBack";
let query = "";
let shown = PAGE_SIZE;

const storageKey = (fp) => `${STATE_VERSION}.${fp}`;

function loadState(fp) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(fp)) || "null");
    if (raw) {
      return {
        handled: new Set(raw.handled || []),
        gone: new Set(raw.gone || []),
        alive: new Set(raw.alive || []),
      };
    }
  } catch { /* private mode */ }
  return { handled: new Set(), gone: new Set(), alive: new Set() };
}

function saveState() {
  if (!fingerprint) return;
  try {
    localStorage.setItem(storageKey(fingerprint), JSON.stringify({
      handled: [...state.handled],
      gone: [...state.gone],
      alive: [...state.alive],
      savedAt: Date.now(),
    }));
  } catch { /* quota or private mode */ }
}

/* ------------------------------------------------------------------ */
/* export snapshots (so two imports can be compared later)              */
/* ------------------------------------------------------------------ */

const SNAPSHOTS_KEY = "uc.snapshots.v1";
const MAX_SNAPSHOTS = 5;

const toPairs = (accounts) =>
  (accounts || []).map((account) => [account.username, account.timestamp ?? null]);
const fromPairs = (pairs) =>
  (pairs || []).map(([username, timestamp]) => ({ username, timestamp: timestamp ?? null }));

function loadSnapshots() {
  try {
    const raw = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((s) => s && s.fp && Array.isArray(s.followers) && Array.isArray(s.following))
      : [];
  } catch {
    return [];
  }
}

function saveSnapshots(list) {
  // Newest first. Evict oldest entries until the payload fits — very large
  // accounts legitimately produce very large lists.
  for (;;) {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
      return true;
    } catch {
      if (!list.length) return false;
      list.splice(-1, 1);
    }
  }
}

function storeSnapshot(parsed, fp) {
  if (!fp || !parsed) return;
  const snapshots = loadSnapshots().filter((s) => s.fp !== fp);
  snapshots.unshift({
    fp,
    when: Date.now(),
    label: parsed.sourceName || "Export",
    followers: toPairs(parsed.followers),
    following: toPairs(parsed.following),
  });
  saveSnapshots(snapshots.slice(0, MAX_SNAPSHOTS));
}

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

let toastTimer = 0;
function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
}

const keyOf = (account) => account.username.toLowerCase();
const profileUrl = (username) =>
  "https://www.instagram.com/" + encodeURIComponent(username) + "/";
const fmt = (n) => Number(n || 0).toLocaleString();
const dateText = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return ""; }
};

function openProfile(url) {
  const link = el("a", { href: url, target: "_blank", rel: "noopener noreferrer" });
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = el("textarea", { style: "position:fixed;opacity:0" });
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch { return false; }
  }
}

/* ------------------------------------------------------------------ */
/* export loading                                                      */
/* ------------------------------------------------------------------ */

const RELEVANT = /(\/|^)(followers?[^/]*\.(json|html))$|(\/|^)(following[^/]*\.(json|html))$|audience_insights\.html$/i;

async function readZip(file, onProgress) {
  if (typeof JSZip === "undefined") {
    throw new Error(T("toast.zipReaderFailed"));
  }
  const zip = await JSZip.loadAsync(file);
  const entries = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (!/\.(json|html)$/i.test(path)) return;
    if (!RELEVANT.test(path)) return;
    entries.push({ path, entry });
  });
  const files = [];
  let done = 0;
  for (const { path, entry } of entries) {
    const text = await entry.async("string");
    files.push({ path, text });
    done += 1;
    onProgress?.(done, entries.length, path);
  }
  return files;
}

function showImportError(message) {
  const box = $("import-error");
  box.hidden = false;
  box.replaceChildren(el("div", { text: message }));
}

async function handleFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  $("import-error").hidden = true;
  $("import-status").hidden = false;
  $("status-text").textContent = T("app.reading");
  $("status-bar").style.width = "8%";
  const biggest = Math.max(...files.map((f) => f.size || 0));
  $("status-sub").textContent =
    (biggest > 150 * 1024 * 1024
      ? T("app.largeExport", { mb: Math.round(biggest / 1048576) })
      : "") + files.map((f) => f.name).join(", ");

  try {
    let parsed;
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
      const entries = await readZip(files[0], (done, total, path) => {
        $("status-bar").style.width = Math.min(85, 8 + (done / Math.max(total, 1)) * 70) + "%";
        $("status-sub").textContent = path;
      });
      $("status-text").textContent = T("app.comparing");
      $("status-bar").style.width = "90%";
      parsed = analyzeExport(entries);
      parsed.sourceName = files[0].name;
    } else {
      const entries = [];
      for (const file of files) {
        entries.push({ path: file.name, text: await file.text() });
      }
      $("status-text").textContent = T("app.comparing");
      parsed = analyzeExport(entries);
      parsed.sourceName = files.map((f) => f.name).join(", ");
    }

    $("status-bar").style.width = "100%";
    await present(parsed);
    $("import-status").hidden = true;
  } catch (error) {
    console.error(error);
    $("import-status").hidden = true;
    showImportError(
      (error && error.message) || T("toast.cannotRead"),
    );
  }
}

async function present(parsed) {
  result = parsed;
  fingerprint = await fingerprintOf([], parsed);
  state = loadState(fingerprint);
  shown = PAGE_SIZE;
  activeView = "notFollowingBack";
  query = "";
  $("search").value = "";
  persistResult();
  storeSnapshot(parsed, fingerprint);
  renderResultScreen();
  applyPendingVerification();
}

function renderResultScreen() {
  probeApi().then((ok) => {
    const button = $("server-check");
    const note = $("server-note");
    if (!button) return;
    if (!ok) {
      // Nothing half-built in a public launch: drop the option entirely and let
      // the page keep only the path that actually works today.
      const block = $("server-option");
      if (block) block.hidden = true;
    }
  });
  $("screen-import").hidden = true;
  $("screen-result").hidden = false;
  $("source-name").textContent = result.sourceName || "Export";
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  renderStats();
  renderWarnings();
  renderIntegrity();
  renderBookmarklet();
  renderHistory();
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.view === activeView));
  });
  renderList();
}

/* ---- remember the last export so a link back to the site restores it ---- */

const LAST_KEY = "uc.last.v1";
const PENDING_KEY = "uc.pendingVerify.v1";

function persistResult() {
  if (!result) return;
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({
      sourceName: result.sourceName,
      fingerprint,
      stats: result.stats,
      info: result.info,
      notFollowingBack: result.notFollowingBack,
      fans: result.fans,
      mutual: result.mutual,
    }));
  } catch {
    // Too big for localStorage (very large accounts): the session still works,
    // the page just will not auto-restore on the next visit.
  }
}

async function restoreLast() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
  } catch { return false; }
  if (!saved || !saved.stats) return false;
  result = saved;
  fingerprint = saved.fingerprint || (await fingerprintOf([], saved));
  state = loadState(fingerprint);
  // The trimmed LAST_KEY payload has no full lists; pull them back from the
  // snapshot store so "changes since last export" works after a reload.
  const snap = loadSnapshots().find((s) => s.fp === fingerprint);
  if (snap) {
    result.followers = fromPairs(snap.followers);
    result.following = fromPairs(snap.following);
  }
  shown = PAGE_SIZE;
  activeView = "notFollowingBack";
  query = "";
  $("search").value = "";
  if (state.gone.size) $("hide-gone").checked = true;
  renderResultScreen();
  return true;
}

/* ------------------------------------------------------------------ */
/* rendering                                                           */
/* ------------------------------------------------------------------ */

function renderStats() {
  const s = result.stats;
  const cards = [
    ["following", T("stats.following"), false],
    ["followers", T("stats.followers"), false],
    ["notFollowingBack", T("stats.notFollowingBack"), true],
    ["fans", T("stats.fans"), false],
    ["mutual", T("stats.mutual"), false],
  ];
  const wrap = $("stats");
  wrap.replaceChildren(
    ...cards.map(([key, label, hi]) =>
      el("div", { class: "stat" + (hi ? " hi" : "") }, [
        el("div", { class: "n", text: fmt(s[key]) }),
        el("div", { class: "l", text: label }),
      ]),
    ),
  );
  document.querySelectorAll("[data-count]").forEach((node) => {
    node.textContent = fmt(s[node.dataset.count]);
  });
}

function renderWarnings() {
  const warnings = result.info.warnings || [];
  const box = $("warn-box");
  if (!warnings.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.replaceChildren(el("ul", {}, warnings.map((w) => el("li", { text: w }))));
}

function renderIntegrity() {
  const info = result.info;
  const integ = info.integrity;
  const complete = integ.complete;
  const badge = $("integrity-badge");
  badge.className = "badge " + (complete ? "ok" : "warn");
  badge.textContent = complete ? T("integrity.badge.ok") : T("integrity.badge.warn");
  if (integ.duplicates) {
    badge.className = "badge bad";
    badge.textContent = T("integrity.badge.dup", { n: fmt(integ.duplicates) });
  }

  const rows = integ.sources.map((source) =>
    el("tr", {}, [
      el("td", { text: source.file }),
      el("td", { text: source.kind }),
      el("td", { class: "num", text: fmt(source.rows) }),
    ]),
  );

  $("integrity-body").replaceChildren(
    el("p", {
      style: "margin:10px 0 0",
      text: T("integrity.summary", {
        files: fmt(integ.filesRead || integ.sources.length),
        rows: fmt(integ.rowsRead),
        dups: fmt(integ.duplicates),
        skipped: fmt(integ.rowsSkipped),
        format: info.format || "unknown",
      }),
    }),
    el("div", { class: "scroll-x" }, [
      el("table", { class: "mini" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: T("integrity.file") }),
          el("th", { text: T("integrity.list") }),
          el("th", { class: "num", text: T("integrity.rows") }),
        ])]),
        el("tbody", {}, rows),
      ]),
    ]),
    integ.reportedFollowers
      ? el("p", {
          text: T("integrity.reported", {
            reported: fmt(integ.reportedFollowers),
            listed: fmt(integ.followers),
          }),
        })
      : el("p", { text: T("integrity.noReport") }),
  );
}

function currentList() {
  if (!result) return [];
  return result[activeView] || [];
}

function filteredList() {
  const hideChecked = $("hide-checked").checked;
  const hideGone = $("hide-gone").checked;
  const q = query.toLowerCase();
  return currentList().filter((account) => {
    const key = keyOf(account);
    if (hideChecked && state.handled.has(key)) return false;
    if (hideGone && state.gone.has(key)) return false;
    if (q && !key.includes(q)) return false;
    return true;
  });
}

function updateProgress() {
  if (!result) return;
  const total = currentList().length;
  const checked = currentList().filter((a) => state.handled.has(keyOf(a))).length;
  $("progress-text").textContent = total
    ? T("app.checkedOf", { n: fmt(checked), m: fmt(total) })
    : "";
  const goneInList = currentList().filter((a) => state.gone.has(keyOf(a))).length;
  const goneNode = $("gone-count");
  if (goneNode) {
    goneNode.textContent = goneInList ? T("app.goneSuffix", { n: fmt(goneInList) }) : "";
    goneNode.style.color = goneInList ? "var(--bad)" : "";
  }
}

function renderList() {
  if (!result) return;
  const list = $("list");
  const all = filteredList();
  const slice = all.slice(0, shown);
  list.replaceChildren();

  if (!all.length) {
    const message = currentList().length
      ? T("list.noMatch")
      : activeView === "notFollowingBack"
        ? T("list.allGood")
        : T("list.empty");
    list.replaceChildren(el("div", { class: "empty", text: message }));
    updateProgress();
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const account of slice) {
    fragment.appendChild(rowFor(account));
  }
  list.appendChild(fragment);

  if (all.length > slice.length) {
    list.appendChild(
      el("div", { style: "padding:13px;text-align:center" }, [
        el("button", {
          class: "btn small",
          type: "button",
          text: T("app.showMore", {
            n: fmt(Math.min(PAGE_SIZE, all.length - slice.length)),
            m: fmt(all.length),
          }),
          onclick: () => { shown += PAGE_SIZE; renderList(); },
        }),
      ]),
    );
  }
  updateProgress();
}

function rowFor(account) {
  const key = keyOf(account);
  const handled = state.handled.has(key);
  const gone = state.gone.has(key);
  const alive = state.alive.has(key);

  const tags = [];
  if (gone) tags.push(el("span", { class: "tag gone", text: T("row.gone") }));
  else if (alive) tags.push(el("span", { class: "tag good", text: T("row.exists") }));
  const when = dateText(account.timestamp);
  if (when) tags.push(el("span", { text: when }));

  return el("div", {
    class: "row" + (handled ? " is-handled" : "") + (gone ? " is-gone" : ""),
  }, [
    el("button", {
      class: "check",
      type: "button",
      role: "checkbox",
      "aria-checked": String(handled),
      "aria-label": T("row.checkOff", { u: account.username }),
      onclick: (event) => {
        if (state.handled.has(key)) state.handled.delete(key);
        else state.handled.add(key);
        saveState();
        event.currentTarget.setAttribute("aria-checked", String(state.handled.has(key)));
        responseToCheck(event.currentTarget.closest(".row"), state.handled.has(key));
        updateProgress();
      },
    }),
    el("div", { class: "avatar", text: account.username.slice(0, 2) }),
    el("div", { class: "who" }, [
      el("div", { class: "uname", text: "@" + account.username }),
      el("div", { class: "meta" }, tags),
    ]),
    el("div", { class: "acts" }, [
      el("button", {
        class: "icon-btn",
        type: "button",
        title: T("row.openProfile"),
        "aria-label": T("row.openOn", { u: account.username }),
        onclick: () => openProfile(profileUrl(account.username)),
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>',
      }),
      el("button", {
        class: "icon-btn",
        type: "button",
        title: gone ? T("row.unmarkGone") : T("row.markGone"),
        "aria-label": T("row.markGone") + " @" + account.username,
        onclick: (event) => {
          if (state.gone.has(key)) state.gone.delete(key);
          else { state.gone.add(key); state.alive.delete(key); }
          saveState();
          const row = event.currentTarget.closest(".row");
          renderListRowState(row, account);
        },
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a8 8 0 1 0 8 8"/><path d="M4 4l16 16"/></svg>',
      }),
    ]),
  ]);
}

function responseToCheck(row, checked) {
  if (!row) return;
  row.classList.toggle("is-handled", checked);
}

function renderListRowState(row, account) {
  if (!row) return;
  renderList();
}

/* ------------------------------------------------------------------ */
/* changes between exports (history diff)                              */
/* ------------------------------------------------------------------ */

function diffOpenButton(username) {
  return el("button", {
    class: "icon-btn",
    type: "button",
    title: T("row.openProfile"),
    "aria-label": T("row.openOn", { u: username }),
    onclick: () => openProfile(profileUrl(username)),
    html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>',
  });
}

function diffSection(key, title, accounts, canCopy) {
  const head = el("div", { class: "diff-head" }, [
    el("div", { class: "diff-title", text: title }),
    el("span", {
      class: "badge" + (accounts.length && key === "unfollowedYou" ? " bad" : ""),
      text: fmt(accounts.length),
    }),
    canCopy && accounts.length
      ? el("button", {
          class: "btn small",
          type: "button",
          text: T("history.copy"),
          onclick: async () => {
            const ok = await copyText(accounts.map((a) => a.username).join("\n"));
            toast(ok ? T("toast.copiedN", { n: fmt(accounts.length) }) : T("toast.copyFallback"));
          },
        })
      : null,
  ]);

  let body;
  if (!accounts.length) {
    body = el("div", { class: "empty", text: T("history.nothing") });
  } else {
    const rows = accounts.map((account) => {
      const tags = [];
      const when = dateText(account.timestamp);
      if (when) tags.push(el("span", { text: when }));
      return el("div", { class: "row" }, [
        el("div", { class: "avatar", text: account.username.slice(0, 2) }),
        el("div", { class: "who" }, [
          el("div", { class: "uname", text: "@" + account.username }),
          el("div", { class: "meta" }, tags),
        ]),
        el("div", { class: "acts" }, [diffOpenButton(account.username)]),
      ]);
    });
    body = el("div", { class: "list diff-list" }, rows);
  }
  return el("div", { class: "diff-block" }, [head, body]);
}

function runDiff(snapshot) {
  const out = $("diff-out");
  if (!out || !snapshot || !result) return;
  if (!Array.isArray(result.followers) || !Array.isArray(result.following)) {
    out.replaceChildren(el("div", { class: "empty", text: T("history.reimport") }));
    return;
  }
  const prev = {
    followers: fromPairs(snapshot.followers),
    following: fromPairs(snapshot.following),
  };
  const diff = computeDiff(prev, result);
  const when = new Date(snapshot.when).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
  out.replaceChildren(
    el("p", { class: "diff-note", text: T("history.note", { when }) }),
    diffSection("unfollowedYou", T("history.unfollowedYou"), diff.unfollowedYou, true),
    diffSection("newFollowers", T("history.newFollowers"), diff.newFollowers, true),
    diffSection("youUnfollowed", T("history.youUnfollowed"), diff.youUnfollowed, false),
    diffSection("newlyFollowed", T("history.newlyFollowed"), diff.newlyFollowed, false),
  );
}

function renderHistory() {
  const slot = $("history-slot");
  if (!slot) return;
  const badge = $("history-badge");
  const snapshots = loadSnapshots();
  const others = snapshots.filter((s) => s.fp !== fingerprint);
  if (badge) {
    badge.textContent = snapshots.length ? T("history.saved", { n: fmt(snapshots.length) }) : "";
    badge.hidden = !snapshots.length;
  }

  if (!snapshots.length) {
    slot.replaceChildren(el("div", { class: "empty", text: T("history.noneYet") }));
    return;
  }
  if (!others.length) {
    slot.replaceChildren(el("div", { class: "empty", text: T("history.onlyCurrent") }));
    return;
  }

  const select = el("select", {
    id: "history-select",
    "aria-label": T("history.select"),
  }, others.map((s) =>
    el("option", {
      value: s.fp,
      text: (s.label || "Export") + " — " + new Date(s.when).toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      }),
    }),
  ));
  const button = el("button", {
    class: "btn primary",
    type: "button",
    text: T("history.compare"),
    onclick: () => runDiff(others.find((s) => s.fp === select.value)),
  });
  const out = el("div", { id: "diff-out" });
  slot.replaceChildren(el("div", { class: "history-bar" }, [select, button]), out);
  runDiff(others[0]); // default to the most recent previous export
}

/* ------------------------------------------------------------------ */
/* dead-account verifier (bookmarklet)                                 */
/* ------------------------------------------------------------------ */

function buildVerifierScript(usernames, returnUrl) {
  const payload = JSON.stringify(usernames);
  return `(function(){
var L=${payload},R=${JSON.stringify(returnUrl)},A='936619743392459',i=0,dead=[],alive=[],fail=[];
var csrf=(document.cookie.match(/csrftoken=([^;]+)/)||[])[1]||'';
function ui(){var o=document.getElementById('uc-panel');if(o)o.remove();var d=document.createElement('div');d.id='uc-panel';d.style.cssText='position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;background:#14141f;color:#f2f2f7;border:1px solid #33334a;border-radius:14px;padding:14px 16px;font:14px -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.5)';
d.innerHTML='<b>Unfollow Checker — checking accounts</b><div id="uc-m" style="color:#9c9cb0;margin-top:6px">starting…</div><div style="height:6px;background:#22222f;border-radius:99px;overflow:hidden;margin:10px 0"><div id="uc-b" style="height:100%;width:0;background:linear-gradient(90deg,#e1306c,#833ab4)"></div></div><div id="uc-t" style="color:#9c9cb0;font-size:12px"></div><div style="margin-top:10px"><button id="uc-x" style="background:#22222f;color:#f2f2f7;border:1px solid #33334a;border-radius:9px;padding:6px 12px;font:13px inherit;cursor:pointer">Stop</button></div>';document.body.appendChild(d);
var x=document.getElementById('uc-x');if(x)x.onclick=function(){window.__ucStop=1;};}
function up(m,n,t){var e=document.getElementById('uc-m'),b=document.getElementById('uc-b'),y=document.getElementById('uc-t');if(e)e.textContent=m;if(b)b.style.width=Math.round(i/n*100)+'%';if(y)y.textContent=t||'';}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function one(u){
 for(var attempt=0;attempt<3;attempt++){
  try{
   var r=await fetch('https://www.instagram.com/api/v1/users/web_profile_info/?username='+encodeURIComponent(u),{headers:{'x-ig-app-id':A,'x-csrftoken':csrf,'x-requested-with':'XMLHttpRequest'},credentials:'include'});
   if(r.status===429){await sleep(8000+attempt*7000);continue;}
   var t=await r.text();
   if(/checkpoint_required|challenge_required/i.test(t)){return 'challenge';}
   if(r.status===404||/Page Not Found|user not found|"user":null/i.test(t)){return 'dead';}
   if(r.status===200){var j;try{j=JSON.parse(t);}catch(e){return 'fail';}
    if(j&&j.data&&j.data.user&&j.data.user.username)return 'alive';
    if(j&&j.data&&j.data.user===null)return 'dead';
    return 'fail';}
   return 'fail';
  }catch(e){await sleep(1500+attempt*2000);}
 }
 return 'fail';
}
(async function(){
 ui();
 up('checking that you are logged in…',1,'');
 if(!/(^|; )ds_user_id=/.test(document.cookie)){up('Not logged in','1','Log in to instagram.com in this browser, then click the bookmark again.');return;}
 var control=await one('instagram');
 if(control!=='alive'){up('Could not reach Instagram as a logged-in user','1','Result: '+control+'. Log in normally, reload instagram.com, then try again. Nothing was changed.');return;}
 for(i=0;i<L.length;i++){
  if(window.__ucStop){break;}
  up('checking @'+L[i],L.length,dead.length+' gone, '+alive.length+' exist, '+fail.length+' failed');
  var v=await one(L[i]);
  if(v==='challenge'){up('Instagram asked for a security check','1','Open instagram.com, complete the check, then run the bookmark again. Nothing was changed.');return;}
  if(v==='dead')dead.push(L[i]);else if(v==='alive')alive.push(L[i]);else fail.push(L[i]);
  await sleep(700+Math.random()*500);
 }
 var out=JSON.stringify({dead:dead,alive:alive,failed:fail,checked:i,when:Date.now()});
 var b64=btoa(unescape(encodeURIComponent(out)));
 up('done — '+dead.length+' gone, '+alive.length+' exist, '+fail.length+' failed',L.length,'opening your results…');
 try{navigator.clipboard&&navigator.clipboard.writeText(out);}catch(e){}
 var w=window.open(R+'#verify='+b64,'_blank');
 if(!w){var ta=document.createElement('textarea');ta.value=out;ta.style.cssText='position:fixed;top:0;left:0;width:100%;height:120px;z-index:2147483647';document.body.appendChild(ta);ta.select();}
})();})();`;
}

/* ------------------------------------------------------------------ */
/* server-side check (works for anyone, no session needed)             */
/* ------------------------------------------------------------------ */

const API_BASE =
  new URLSearchParams(location.search).get("api") ||
  (location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:8099"
    : "https://unfollow-checker-api.up.railway.app");

const SERVER_BATCH = 200;

// The checker service is optional: if it isn't running, the button says so
// instead of erroring after a click. Checked once per page load.
let apiHealthy = null;
async function probeApi() {
  if (apiHealthy !== null) return apiHealthy;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(API_BASE + "/healthz", { signal: controller.signal });
    clearTimeout(timer);
    const body = await response.json();
    apiHealthy = response.ok && body.ok === true && Number(body.sessions) > 0;
  } catch {
    apiHealthy = false;
  }
  return apiHealthy;
}

async function checkWithServer() {
  const accounts = result ? result.notFollowingBack : [];
  const names = accounts.map((a) => a.username);
  if (!names.length) {
    toast(T("toast.nothingToCheck"));
    return;
  }

  const button = $("server-check");
  const progress = $("server-progress");
  const bar = $("server-bar");
  const status = $("server-status");
  button.disabled = true;
  progress.hidden = false;
  bar.style.width = "2%";
  status.textContent = T("toast.contacting");

  // Leave out accounts we already know the answer for.
  const unknown = names.filter((name) => {
    const key = name.toLowerCase();
    return !state.gone.has(key) && !state.alive.has(key);
  });

  const dead = [];
  const alive = [];
  const failed = [];
  let done = 0;
  const total = unknown.length;

  try {
    for (let start = 0; start < unknown.length; start += SERVER_BATCH) {
      const batch = unknown.slice(start, start + SERVER_BATCH);
      let response;
      try {
        response = await fetch(API_BASE + "/api/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ usernames: batch }),
        });
      } catch {
        throw new Error(T("toast.unreachable"));
      }

      if (response.status === 503) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error === "no_session"
            ? T("toast.noSession")
            : T("toast.serviceDown"),
        );
      }
      if (response.status === 429) {
        throw new Error(T("toast.rateLimited"));
      }
      if (!response.ok) {
        throw new Error(T("toast.serviceError", { code: response.status }));
      }

      const body = await response.json();
      for (const [username, info] of Object.entries(body.results || {})) {
        if (info.status === "dead") dead.push(username);
        else if (info.status === "alive") alive.push(username);
        else failed.push(username);
      }
      done += batch.length;
      bar.style.width = Math.min(96, 4 + (done / Math.max(total, 1)) * 92) + "%";
      status.textContent = T("toast.serverProgress", {
        done: fmt(done),
        total: fmt(total),
        gone: dead.length,
        exist: alive.length,
        unknown: failed.length,
      });
    }

    bar.style.width = "100%";
    status.textContent = T("toast.serverDone", {
      gone: dead.length,
      exist: alive.length,
      unknown: failed.length,
    });
    if (dead.length || alive.length) {
      applyVerification({ dead, alive, failed, checked: total, when: Date.now() });
    } else {
      toast(T("toast.nothingClassified"));
    }
  } catch (error) {
    bar.style.width = "0%";
    status.textContent = error.message;
    toast(error.message);
  } finally {
    button.disabled = false;
  }
}

function renderBookmarklet() {
  const names = result.notFollowingBack.map((a) => a.username);
  if (!names.length) {
    $("bookmarklet-slot").textContent = T("verify.slot.empty");
    return;
  }
  const code = buildVerifierScript(names, SITE_URL);
  const href = "javascript:" + encodeURIComponent(code);
  const link = el("a", {
    class: "bm",
    href,
    text: T("verify.bm.check", { n: fmt(names.length) }),
    onclick: (event) => event.preventDefault(),
  });
  const copyButton = el("button", {
    class: "btn small",
    type: "button",
    text: T("verify.bm.copy"),
    onclick: async () => {
      const ok = await copyText(code);
      if (ok) {
        copyButton.textContent = T("verify.bm.copied");
        toast(T("verify.bm.copiedToast"));
        setTimeout(() => { copyButton.textContent = T("verify.bm.copy"); }, 2500);
      } else {
        toast(T("verify.bm.copyFailed"));
      }
    },
  });
  $("bookmarklet-slot").replaceChildren(
    el("div", { class: "bm-row" }, [link, copyButton]),
  );
  const note = el("div", {
    style: "font-size:12.5px;color:var(--muted);margin-top:8px",
    text: T("verify.bm.note"),
  });
  $("bookmarklet-slot").appendChild(note);
}

function applyVerification(payload) {
  let data;
  try {
    data = typeof payload === "string" ? JSON.parse(payload) : payload;
  } catch {
    toast(T("toast.notVerifierOutput"));
    return;
  }
  if (!data || !Array.isArray(data.dead)) {
    toast(T("toast.noDeadList"));
    return;
  }
  if (!result) {
    // Results arrived before an export was imported (fresh browser, or the
    // export was never loaded here). Hold on to them until one is.
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    toast(T("toast.verifyPending"));
    return;
  }
  let added = 0;
  for (const name of data.dead) {
    const key = String(name).toLowerCase();
    if (!state.gone.has(key)) added += 1;
    state.gone.add(key);
    state.alive.delete(key);
  }
  for (const name of data.alive || []) {
    const key = String(name).toLowerCase();
    state.alive.add(key);
    state.gone.delete(key);
  }
  saveState();
  // Once we know which accounts are gone, get them out of the way: hide them by
  // default but keep the count on screen so they can be brought back.
  if (added) $("hide-gone").checked = true;
  renderList();
  toast(T("toast.markedGone", { n: fmt(added), m: fmt((data.alive || []).length) }));
  $("verify-panel").open = false;
}

function applyPendingVerification() {
  let raw;
  try { raw = localStorage.getItem(PENDING_KEY); } catch { return; }
  if (!raw) return;
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  applyVerification(raw);
}

function readVerifyHash() {
  const hash = location.hash || "";
  const match = /verify=([^&]+)/.exec(hash);
  if (!match) return;
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
    applyVerification(json);
  } catch {
    toast(T("toast.notALink"));
  }
  history.replaceState(null, "", location.pathname + location.search);
}

/* ------------------------------------------------------------------ */
/* exports                                                             */
/* ------------------------------------------------------------------ */

function downloadCsv() {
  const rows = [["category", "username", "profile_url", "follow_date", "status"]];
  const categories = [
    ["not_following_back", result.notFollowingBack],
    ["fans", result.fans],
    ["mutual", result.mutual],
  ];
  for (const [category, accounts] of categories) {
    for (const account of accounts) {
      const key = keyOf(account);
      rows.push([
        category,
        account.username,
        profileUrl(account.username),
        account.timestamp ? new Date(account.timestamp * 1000).toISOString() : "",
        state.gone.has(key) ? "gone" : state.alive.has(key) ? "exists" : "unverified",
      ]);
    }
  }
  const csv = rows
    .map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = el("a", { href: url, download: "instagram_audit_accounts.csv" });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(T("toast.csvDone"));
}

/* ------------------------------------------------------------------ */
/* wiring                                                              */
/* ------------------------------------------------------------------ */

const drop = $("drop");
drop.addEventListener("click", () => $("file").click());
drop.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    $("file").click();
  }
});
$("file").addEventListener("change", (event) => {
  handleFiles(event.target.files);
  event.target.value = "";
});
for (const type of ["dragenter", "dragover"]) {
  drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.add("hot");
  });
}
for (const type of ["dragleave", "drop"]) {
  drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.remove("hot");
  });
}
drop.addEventListener("drop", (event) => {
  if (event.dataTransfer?.files?.length) handleFiles(event.dataTransfer.files);
});

$("search").addEventListener("input", (event) => {
  query = event.target.value.trim();
  if (!result) return;
  shown = PAGE_SIZE;
  renderList();
});
$("hide-checked").addEventListener("change", () => { shown = PAGE_SIZE; renderList(); });
$("hide-gone").addEventListener("change", () => { shown = PAGE_SIZE; renderList(); });

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (!result) return;
    activeView = tab.dataset.view;
    shown = PAGE_SIZE;
    document.querySelectorAll(".tab").forEach((other) => {
      other.setAttribute("aria-selected", String(other === tab));
    });
    renderList();
  });
});

$("open-next").addEventListener("click", () => {
  if (!result) { toast(T("toast.importFirst")); return; }
  const pool = filteredList().length ? filteredList() : currentList();
  const next = pool.find((account) => !state.handled.has(keyOf(account)))
    || currentList().find((account) => !state.handled.has(keyOf(account)));
  if (!next) {
    toast(T("toast.allChecked"));
    return;
  }
  state.handled.add(keyOf(next));
  saveState();
  openProfile(profileUrl(next.username));
  renderList();
  toast(T("toast.openedAndChecked", { u: next.username }));
});

$("copy-list").addEventListener("click", async () => {
  if (!result) { toast(T("toast.importFirst")); return; }
  const names = filteredList().map((account) => account.username);
  if (!names.length) {
    toast(T("toast.nothingToCopy"));
    return;
  }
  const ok = await copyText(names.join("\n"));
  toast(ok ? T("toast.copiedN", { n: fmt(names.length) }) : T("toast.copyFallback"));
});

$("download-csv").addEventListener("click", () => {
  if (!result) { toast(T("toast.importFirst")); return; }
  downloadCsv();
});

$("reset-progress").addEventListener("click", () => {
  if (!state.handled.size) {
    toast(T("toast.nothingToReset"));
    return;
  }
  if (!confirm(T("toast.confirmReset"))) return;
  state.handled.clear();
  saveState();
  renderList();
  toast(T("toast.resetDone"));
});

$("apply-verify").addEventListener("click", () => {
  const text = $("verify-paste").value.trim();
  if (!text) {
    toast(T("toast.pasteFirst"));
    return;
  }
  applyVerification(text);
  $("verify-paste").value = "";
});

$("server-check").addEventListener("click", checkWithServer);

$("clear-dead").addEventListener("click", () => {
  if (!state.gone.size) {
    toast(T("toast.noGoneMarks"));
    return;
  }
  state.gone.clear();
  state.alive.clear();
  saveState();
  renderList();
  toast(T("toast.goneCleared"));
});


/* ------------------------------------------------------------------ */
/* progress backup (moving devices, or surviving a browser wipe)       */
/* ------------------------------------------------------------------ */

$("export-progress").addEventListener("click", () => {
  if (!result) { toast(T("toast.importFirst")); return; }
  const payload = {
    app: "unfollow-checker",
    version: 1,
    fingerprint,
    source: result.sourceName || "",
    savedAt: new Date().toISOString(),
    handled: [...state.handled],
    gone: [...state.gone],
    alive: [...state.alive],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = el("a", { href: url, download: "unfollow-checker-progress.json" });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("progress-note").textContent = T("devices.savedNote", {
    n: fmt(state.handled.size),
    m: fmt(state.gone.size),
  });
});

$("import-progress").addEventListener("click", () => $("progress-file").click());

$("progress-file").addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (!result) { toast(T("toast.restoreFirst")); return; }
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    toast(T("toast.notJson"));
    return;
  }
  if (!data || !Array.isArray(data.handled)) {
    toast(T("toast.notProgress"));
    return;
  }
  if (data.fingerprint && data.fingerprint !== fingerprint) {
    if (!confirm(T("toast.confirmMerge"))) return;
  }
  let added = 0;
  for (const key of data.handled) { if (!state.handled.has(key)) { state.handled.add(key); added += 1; } }
  for (const key of data.gone || []) { state.gone.add(key); state.alive.delete(key); }
  for (const key of data.alive || []) { if (!state.gone.has(key)) state.alive.add(key); }
  saveState();
  if (state.gone.size) $("hide-gone").checked = true;
  renderList();
  $("progress-note").textContent = T("devices.restoredNote", {
    n: fmt(state.handled.size),
    m: fmt(state.gone.size),
    added: fmt(added),
  });
  toast(T("toast.restoredN", { n: fmt(added) }));
});

$("new-export").addEventListener("click", () => {
  $("screen-result").hidden = true;
  $("screen-import").hidden = false;
  window.scrollTo({ top: 0 });
});

window.addEventListener("hashchange", readVerifyHash);

/* A language switch re-renders every dynamic string that is already on screen. */
document.addEventListener("uc:langchange", () => {
  if (!result) return;
  renderStats();
  renderWarnings();
  renderIntegrity();
  renderBookmarklet();
  renderHistory();
  renderList();
});

/* Boot: restore the last export (so a verifier link lands on a populated page),
   then apply any hash payload or queued verifier output. */
(async function boot() {
  await restoreLast();
  readVerifyHash();
  if (result) applyPendingVerification();
})();
