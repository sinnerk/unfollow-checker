/**
 * Website parser tests (node --test).
 *
 * These lock the browser build to the same rules as ig_audit.py: one row per
 * account, case-insensitive matching, split files merged, HTML fallback.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { analyzeExport, cleanUsername, extractEntries, extractHtmlEntries } from "../../docs/js/parse.js";

const TS = 1795502698;

const followerRecord = (username) => ({
  title: "",
  media_list_data: [],
  string_list_data: [
    { href: `https://www.instagram.com/${username}`, value: username, timestamp: TS },
  ],
});

const followingRecord = (username) => ({
  title: username,
  string_list_data: [{ href: `https://www.instagram.com/_u/${username}`, timestamp: TS }],
});

const zipFiles = ({ followers = [], following = [], extra = [] }) => [
  ...extra,
  {
    path: "connections/followers_and_following/followers_1.json",
    text: JSON.stringify(followers.map(followerRecord)),
  },
  {
    path: "connections/followers_and_following/following.json",
    text: JSON.stringify({ relationships_following: following.map(followingRecord) }),
  },
];

test("counts following, followers, mutual and not-back", () => {
  const result = analyzeExport(zipFiles({
    followers: ["alice", "bob", "carol"],
    following: ["bob", "carol", "dave", "erin"],
  }));
  assert.equal(result.stats.following, 4);
  assert.equal(result.stats.followers, 3);
  assert.equal(result.stats.mutual, 2);
  assert.equal(result.stats.notFollowingBack, 2);
  assert.equal(result.stats.fans, 1);
  assert.deepEqual(result.notFollowingBack.map((a) => a.username), ["dave", "erin"]);
  assert.deepEqual(result.fans.map((a) => a.username), ["alice"]);
});

test("one row per record even when value and href agree", () => {
  const record = followerRecord("alice");
  assert.deepEqual(extractEntries(record), [["alice", TS]]);

  const files = [
    { path: "connections/followers_and_following/followers_1.json", text: JSON.stringify([record, record]) },
    { path: "connections/followers_and_following/following.json", text: JSON.stringify({ relationships_following: [followingRecord("bob")] }) },
  ];
  const result = analyzeExport(files);
  assert.equal(result.info.integrity.rowsRead, 3); // 2 follower rows + 1 following row
  assert.equal(result.info.integrity.followers, 1);
  assert.equal(result.info.integrity.duplicates, 1);
});

test("split follower files are merged into one list", () => {
  const files = [
    { path: "connections/followers_and_following/followers_1.json", text: JSON.stringify([followerRecord("alice")]) },
    { path: "connections/followers_and_following/followers_2.json", text: JSON.stringify([followerRecord("bob"), followerRecord("alice")]) },
    { path: "connections/followers_and_following/following.json", text: JSON.stringify({ relationships_following: [followingRecord("alice")] }) },
  ];
  const result = analyzeExport(files);
  assert.equal(result.stats.followers, 2);
  assert.equal(result.stats.following, 1);
});

test("matching is case-insensitive but display keeps original casing", () => {
  const result = analyzeExport(zipFiles({ followers: ["Alice"], following: ["aLiCe"] }));
  assert.equal(result.stats.notFollowingBack, 0);
  assert.equal(result.stats.mutual, 1);
});

test("old /_u/ links and bare handles normalise to the same username", () => {
  assert.equal(cleanUsername("https://www.instagram.com/_u/maya.builds"), "maya.builds");
  assert.equal(cleanUsername("https://instagram.com/maya.builds/"), "maya.builds");
  assert.equal(cleanUsername("@maya.builds"), "maya.builds");
  assert.equal(cleanUsername("maya.builds"), "maya.builds");
  assert.equal(cleanUsername("has spaces"), null);
  assert.equal(cleanUsername(""), null);
});

test("threads following.json is never mistaken for a social following list", () => {
  const files = zipFiles({ followers: ["alice"], following: ["bob"] });
  files.push({
    path: "your_instagram_activity/threads/following.json",
    text: JSON.stringify([followingRecord("thread.account")]),
  });
  const result = analyzeExport(files);
  assert.equal(result.stats.following, 1);
  assert.equal(result.stats.notFollowedBack, undefined);
  assert.equal(result.stats.notFollowingBack, 1);
});

test("HTML export pages are read when JSON is absent", () => {
  const html = `
    <div><a href="https://www.instagram.com/alice/">alice</a></div><div>Nov 18, 2026 11:11 am</div>
    <div><a href="https://www.instagram.com/bob/">bob</a></div><div>Oct 2, 2025 9:05 pm</div>`;
  const entries = extractHtmlEntries(html);
  assert.deepEqual(entries.map((e) => e[0]), ["alice", "bob"]);
  assert.ok(entries[0][1] > 0);

  const files = [
    { path: "connections/followers_and_following/followers_1.html", text: html },
    {
      path: "connections/followers_and_following/following.html",
      text: `<div><a href="https://www.instagram.com/alice/">alice</a></div><div>Nov 18, 2026 11:11 am</div>
             <div><a href="https://www.instagram.com/carol/">carol</a></div><div>Oct 2, 2025 9:05 pm</div>`,
    },
  ];
  const result = analyzeExport(files);
  assert.equal(result.info.format, "html");
  assert.equal(result.stats.followers, 2);
  assert.equal(result.stats.following, 2);
  assert.equal(result.stats.mutual, 1);
  assert.ok(result.info.warnings.some((w) => w.includes("HTML")));
});

test("missing one side raises a clear error", () => {
  assert.throws(
    () => analyzeExport([{
      path: "connections/followers_and_following/followers_1.json",
      text: JSON.stringify([followerRecord("alice")]),
    }]),
    /Could not find the following list/,
  );
  assert.throws(() => analyzeExport([]), /No follower or following list/);
});

test("reported follower count flags a truncated export", () => {
  const followers = Array.from({ length: 10 }, (_, i) => `f${i}`);
  const following = Array.from({ length: 3 }, (_, i) => `g${i}`);
  const files = zipFiles({ followers, following });
  files.push({
    path: "logged_information/past_instagram_insights/audience_insights.html",
    text: "<div>Followers 400</div>",
  });
  const result = analyzeExport(files);
  assert.equal(result.info.integrity.reportedFollowers, 400);
  assert.equal(result.info.integrity.complete, false);
  assert.ok(result.info.truncation);
  assert.ok(result.info.warnings[0].includes("superset"));
});
