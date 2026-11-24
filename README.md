# Unfollow Checker

**See exactly who doesn't follow you back on Instagram.**

### → [sinnerk.github.io/unfollow-checker](https://sinnerk.github.io/unfollow-checker/)

Free, open source (MIT), and it runs entirely in your browser. Drop your Instagram data export on the page and get the real lists in about five seconds — nothing is uploaded, there is no login, and there are no accounts, analytics or scraping anywhere in the flow.

---

## What it shows you

| List | Meaning |
| --- | --- |
| **Following** | accounts you follow |
| **Followers** | accounts that follow you |
| **Doesn't follow back** | you follow them, they don't follow you |
| **Follows you only** | they follow you, you don't follow back |
| **Mutual** | both directions |

Plus:

- **Exact counts.** Handles are reconciled case-insensitively, split files (`followers_1.json`, `followers_2.json`, …) are merged into one list, and duplicate rows are collapsed — so one account never counts twice.
- **Export integrity panel.** Shows which files were read, how many rows each held, how many duplicates were dropped, and warns you when Instagram's own insights page disagrees with the export (the honest "this list may be a superset" case).
- **A real work loop.** "Open next & check off" opens the next unchecked profile in a new tab and records it, so you never lose your place. Search, filter, hide what's done, copy the list, download a CSV with follow dates.
- **Per-export progress.** Check-offs are keyed to the exact export you imported, stored in your own browser. Import a newer export and you start clean instead of inheriting stale marks.
- **Optional dead-account check.** A one-click bookmarklet runs inside your own logged-in Instagram tab and flags deleted or deactivated accounts (Instagram only answers "does this profile exist?" for a signed-in visitor). Read-only, ~1 account per second, and it never touches a server of ours.
- **Works on phones.** Same page, same features, thumb-sized controls.

## How the privacy story actually works

The ZIP is opened by JavaScript in your tab. There is no backend, no upload endpoint, and no third-party script — the zip reader is bundled with the site. You can prove it: load the page, switch off your network, and import the file.

What is stored: your check-offs and gone marks, in this browser's `localStorage`, keyed to that export. Nothing is synced anywhere. Details: [privacy page](https://sinnerk.github.io/unfollow-checker/privacy.html).

## Get your export (2 minutes)

1. Instagram → **Accounts Center** → **Your information and permissions** → **Download your information**.
2. Pick the account, then **Create export** → **Download to device**.
3. Format **JSON**, date range **All time**, and untick everything except **Followers and following**.
4. When Instagram emails you the ZIP, drop it on the [site](https://sinnerk.github.io/unfollow-checker/app.html). Don't unzip it.

Full walkthrough with screenshots-free step lists and troubleshooting: [tutorials](https://sinnerk.github.io/unfollow-checker/tutorials.html).

## FAQ

**Does it unfollow people for me?** No, and it never will. Instagram has no public unfollow API; every "mass unfollow" tool is either scraping your password or breaking the terms. Open the profile, tap Unfollow, come back, hit next.

**Someone shows up as not following back, but I think they do.** The export is a snapshot (a day or two old for big accounts), or it's an HTML export — HTML silently drops older rows, which the integrity panel flags. Use JSON for an exact answer.

**Does it work with HTML exports?** Yes, with that caveat above.

**Why do deleted accounts still appear?** The export lists handles, not live profiles. Use the optional bookmarklet check, or mark rows as gone by hand.

## Development

The site and the analysis engine are plain JavaScript and Python — no build step, no framework.

```bash
# website (docs/ is served as-is; any static server works)
python -m http.server 8765 --directory docs

# parser tests (9)
node --test tests/web/parse.test.mjs

# CLI + parser tests (24)
python -m unittest discover -s tests
```

```
docs/                 the entire website (GitHub Pages source)
  index.html          landing page
  app.html            the tool
  tutorials.html      step-by-step guide
  privacy.html        what is and isn't sent anywhere
  js/parse.js         export parser (shared logic, tested)
  js/app.js           UI
  vendor/jszip.min.js bundled zip reader (no CDN)
server/               optional checker API (FastAPI + Cloudflare Worker)
deploy/               helper scripts
ig_audit.py           Python engine + CLI used by the tests and by contributors
tests/                parser and CLI test suites
```

`ig_audit.py` still exists as a command-line tool for contributors and for CI parity checks — the website is the product:

```bash
python ig_audit.py "/path/to/instagram-export.zip"
```

## License

MIT — see [LICENSE](LICENSE). Not affiliated with Instagram or Meta.
