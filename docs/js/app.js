/**
 * Unfollow Checker — browser app.
 *
 * Everything happens locally: JSZip reads the export in memory, parse.js does
 * the reconciliation, and progress is stored under a fingerprint of the export.
 */

import { analyzeExport, fingerprintOf } from "./parse.js";

const STATE_VERSION = "uc.v1";
const PAGE_SIZE = 150;
const SITE_URL = location.origin + location.pathname.replace(/[^/]*$/, "");

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
    throw new Error("The zip reader failed to load. Check your connection and reload the page.");
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
  $("status-text").textContent = "Reading export…";
  $("status-bar").style.width = "8%";
  $("status-sub").textContent = files.map((f) => f.name).join(", ");

  try {
    let parsed;
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) {
      const entries = await readZip(files[0], (done, total, path) => {
        $("status-bar").style.width = Math.min(85, 8 + (done / Math.max(total, 1)) * 70) + "%";
        $("status-sub").textContent = path;
      });
      $("status-text").textContent = "Comparing lists…";
      $("status-bar").style.width = "90%";
      parsed = analyzeExport(entries);
      parsed.sourceName = files[0].name;
    } else {
      const entries = [];
      for (const file of files) {
        entries.push({ path: file.name, text: await file.text() });
      }
      $("status-text").textContent = "Comparing lists…";
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
      (error && error.message) ||
        "That file could not be read. Make sure it is the .zip Instagram emailed you.",
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

  $("screen-import").hidden = true;
  $("screen-result").hidden = false;
  $("source-name").textContent = parsed.sourceName || "Export";
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  renderStats();
  renderWarnings();
  renderIntegrity();
  renderBookmarklet();
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.view === activeView));
  });
  renderList();
}

/* ------------------------------------------------------------------ */
/* rendering                                                           */
/* ------------------------------------------------------------------ */

function renderStats() {
  const s = result.stats;
  const cards = [
    ["following", "Following", false],
    ["followers", "Followers", false],
    ["notFollowingBack", "Don't follow back", true],
    ["fans", "Follows you only", false],
    ["mutual", "Mutual", false],
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
  badge.textContent = complete ? "complete" : "incomplete";
  if (integ.duplicates) {
    badge.className = "badge bad";
    badge.textContent = integ.duplicates + " duplicates";
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
      text:
        "Read " + fmt(integ.filesRead || integ.sources.length) + " list file(s), " +
        fmt(integ.rowsRead) + " row(s); " + fmt(integ.duplicates) + " duplicate row(s) dropped, " +
        fmt(integ.rowsSkipped) + " unreadable row(s). Format: " + (info.format || "unknown") + ".",
    }),
    el("div", { class: "scroll-x" }, [
      el("table", { class: "mini" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "File" }), el("th", { text: "List" }), el("th", { class: "num", text: "Rows" }),
        ])]),
        el("tbody", {}, rows),
      ]),
    ]),
    integ.reportedFollowers
      ? el("p", {
          text:
            "Instagram's own insights page reported " + fmt(integ.reportedFollowers) +
            " followers at export time; this export lists " + fmt(integ.followers) + ".",
        })
      : el("p", { text: "No audience-insights page in this export, so the follower count could not be cross-checked against Instagram's own number." }),
  );
}

function currentList() {
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
  const total = currentList().length;
  const checked = currentList().filter((a) => state.handled.has(keyOf(a))).length;
  $("progress-text").textContent = total
    ? `${fmt(checked)} / ${fmt(total)} checked off`
    : "";
}

function renderList() {
  const list = $("list");
  const all = filteredList();
  const slice = all.slice(0, shown);
  list.replaceChildren();

  if (!all.length) {
    const message = currentList().length
      ? "Nothing matches this filter."
      : activeView === "notFollowingBack"
        ? "Everyone you follow follows you back."
        : "This list is empty.";
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
          text: `Show ${fmt(Math.min(PAGE_SIZE, all.length - slice.length))} more of ${fmt(all.length)}`,
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
  if (gone) tags.push(el("span", { class: "tag gone", text: "gone" }));
  else if (alive) tags.push(el("span", { class: "tag good", text: "exists" }));
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
      "aria-label": "Check off @" + account.username,
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
        title: "Open profile",
        "aria-label": "Open @" + account.username + " on Instagram",
        onclick: () => openProfile(profileUrl(account.username)),
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>',
      }),
      el("button", {
        class: "icon-btn",
        type: "button",
        title: gone ? "Unmark gone" : "Mark as gone (deleted or deactivated)",
        "aria-label": "Mark @" + account.username + " as gone",
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
/* dead-account verifier (bookmarklet)                                 */
/* ------------------------------------------------------------------ */

function buildVerifierScript(usernames, returnUrl) {
  const payload = JSON.stringify(usernames);
  return `(function(){
var L=${payload},R=${JSON.stringify(returnUrl)},A='936619743392459',i=0,dead=[],alive=[],fail=[];
var csrf=(document.cookie.match(/csrftoken=([^;]+)/)||[])[1]||'';
function ui(){var d=document.createElement('div');d.id='uc-panel';d.style.cssText='position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;background:#14141f;color:#f2f2f7;border:1px solid #33334a;border-radius:14px;padding:14px 16px;font:14px -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.5)';
d.innerHTML='<b>Unfollow Checker — checking accounts</b><div id="uc-m" style="color:#9c9cb0;margin-top:6px">starting…</div><div style="height:6px;background:#22222f;border-radius:99px;overflow:hidden;margin:10px 0"><div id="uc-b" style="height:100%;width:0;background:linear-gradient(90deg,#e1306c,#833ab4)"></div></div><div id="uc-t" style="color:#9c9cb0;font-size:12px"></div>';document.body.appendChild(d);}
function up(m,n,t){var x=document.getElementById('uc-m'),b=document.getElementById('uc-b'),y=document.getElementById('uc-t');if(x)x.textContent=m;if(b)b.style.width=Math.round(i/n*100)+'%';if(y)y.textContent=t||'';}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function one(u){
 for(var attempt=0;attempt<3;attempt++){
  try{
   var r=await fetch('https://www.instagram.com/api/v1/users/web_profile_info/?username='+encodeURIComponent(u),{headers:{'x-ig-app-id':A,'x-csrftoken':csrf,'x-requested-with':'XMLHttpRequest'},credentials:'include'});
   if(r.status===429){await sleep(6000+attempt*6000);continue;}
   var t=await r.text();
   if(r.status===404||/Page Not Found|user not found|"user":null/i.test(t)){return 'dead';}
   if(r.status===200){var j;try{j=JSON.parse(t);}catch(e){return 'fail';}
    if(j&&j.data&&j.data.user&&j.data.user.username)return 'alive';
    return 'dead';}
   return 'fail';
  }catch(e){await sleep(1500+attempt*2000);}
 }
 return 'fail';
}
(async function(){
 ui();
 for(i=0;i<L.length;i++){
  up('checking @'+L[i],L.length,dead.length+' gone, '+alive.length+' exist, '+fail.length+' failed');
  var v=await one(L[i]);
  if(v==='dead')dead.push(L[i]);else if(v==='alive')alive.push(L[i]);else fail.push(L[i]);
  await sleep(700+Math.random()*500);
 }
 var out=JSON.stringify({dead:dead,alive:alive,failed:fail,checked:L.length,when:Date.now()});
 var b64=btoa(unescape(encodeURIComponent(out)));
 up('done — '+dead.length+' gone, '+alive.length+' exist, '+fail.length+' failed',L.length,'opening your results…');
 try{navigator.clipboard&&navigator.clipboard.writeText(out);}catch(e){}
 var w=window.open(R+'#verify='+b64,'_blank');
 if(!w){var ta=document.createElement('textarea');ta.value=out;document.body.appendChild(ta);ta.select();}
})();})();`;
}

function renderBookmarklet() {
  const names = result.notFollowingBack.map((a) => a.username);
  if (!names.length) {
    $("bookmarklet-slot").textContent = "Nothing to check — the list is empty.";
    return;
  }
  const code = buildVerifierScript(names, SITE_URL);
  const href = "javascript:" + encodeURIComponent(code);
  const link = el("a", {
    class: "bm",
    href,
    text: "Check " + fmt(names.length) + " accounts",
    onclick: (event) => event.preventDefault(),
  });
  $("bookmarklet-slot").replaceChildren(link);
  const note = el("div", {
    style: "font-size:12.5px;color:var(--muted);margin-top:8px",
    text: "Bookmarklets are blocked on some phones and on Instagram's in-app browser — open this site in a real browser, and use the manual mark button on mobile.",
  });
  $("bookmarklet-slot").appendChild(note);
}

function applyVerification(payload) {
  let data;
  try {
    data = typeof payload === "string" ? JSON.parse(payload) : payload;
  } catch {
    toast("That does not look like verifier output.");
    return;
  }
  if (!data || !Array.isArray(data.dead)) {
    toast("No \"dead\" list in that output.");
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
  renderList();
  toast(`Marked ${fmt(added)} account(s) as gone, ${fmt((data.alive || []).length)} confirmed to exist.`);
  $("verify-panel").open = false;
}

function readVerifyHash() {
  const hash = location.hash || "";
  const match = /verify=([^&]+)/.exec(hash);
  if (!match) return;
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
    applyVerification(json);
  } catch {
    toast("Could not read the verifier result from the link.");
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
  toast("CSV downloaded.");
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
  shown = PAGE_SIZE;
  renderList();
});
$("hide-checked").addEventListener("change", () => { shown = PAGE_SIZE; renderList(); });
$("hide-gone").addEventListener("change", () => { shown = PAGE_SIZE; renderList(); });

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeView = tab.dataset.view;
    shown = PAGE_SIZE;
    document.querySelectorAll(".tab").forEach((other) => {
      other.setAttribute("aria-selected", String(other === tab));
    });
    renderList();
  });
});

$("open-next").addEventListener("click", () => {
  const pool = filteredList().length ? filteredList() : currentList();
  const next = pool.find((account) => !state.handled.has(keyOf(account)))
    || currentList().find((account) => !state.handled.has(keyOf(account)));
  if (!next) {
    toast("Everything in this list is checked off.");
    return;
  }
  state.handled.add(keyOf(next));
  saveState();
  openProfile(profileUrl(next.username));
  renderList();
  toast("Opened @" + next.username + " and checked it off.");
});

$("copy-list").addEventListener("click", async () => {
  const names = filteredList().map((account) => account.username);
  if (!names.length) {
    toast("Nothing to copy.");
    return;
  }
  const ok = await copyText(names.join("\n"));
  toast(ok ? `Copied ${fmt(names.length)} usernames.` : "Could not copy — use the CSV instead.");
});

$("download-csv").addEventListener("click", downloadCsv);

$("reset-progress").addEventListener("click", () => {
  if (!state.handled.size) {
    toast("Nothing to reset.");
    return;
  }
  if (!confirm("Clear every check-off for this export? Gone marks are kept.")) return;
  state.handled.clear();
  saveState();
  renderList();
  toast("Check-offs cleared.");
});

$("apply-verify").addEventListener("click", () => {
  const text = $("verify-paste").value.trim();
  if (!text) {
    toast("Paste the verifier output first.");
    return;
  }
  applyVerification(text);
  $("verify-paste").value = "";
});

$("clear-dead").addEventListener("click", () => {
  if (!state.gone.size) {
    toast("No gone marks to clear.");
    return;
  }
  state.gone.clear();
  state.alive.clear();
  saveState();
  renderList();
  toast("Gone marks cleared.");
});

$("new-export").addEventListener("click", () => {
  $("screen-result").hidden = true;
  $("screen-import").hidden = false;
  window.scrollTo({ top: 0 });
});

window.addEventListener("hashchange", readVerifyHash);
readVerifyHash();
