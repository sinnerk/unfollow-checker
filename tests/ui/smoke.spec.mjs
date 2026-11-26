/**
 * End-to-end smoke test: the full path a real visitor takes.
 *
 * Builds synthetic Instagram exports in memory (same record shape Instagram
 * writes), drops them on the page like a real file, and checks the numbers
 * and the new export-diffing panel against known answers.
 */
import { test, expect } from "playwright/test";
import JSZip from "jszip";

const T = 1_700_000_000;
const T2 = 1_750_000_000;

function followerRecord(username) {
  return {
    string_list_data: [
      { href: `https://www.instagram.com/${username}/`, value: username, timestamp: T },
    ],
  };
}

function followingRecord(username, ts = T) {
  return {
    title: username,
    string_list_data: [
      { href: `https://www.instagram.com/${username}/`, value: username, timestamp: ts },
    ],
  };
}

async function buildZip({ followers, following }) {
  const zip = new JSZip();
  const folder = zip.folder("connections/followers_and_following");
  folder.file("followers_1.json", JSON.stringify(followers.map(followerRecord)));
  folder.file("following.json", JSON.stringify({ relationships_following: following.map(followingRecord) }));
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return { name: "instagram-export.zip", mimeType: "application/zip", buffer };
}

test("import an export and read the real lists", async ({ page }) => {
  await page.goto("/app.html");
  const zip = await buildZip({
    followers: ["alice", "bob", "carol"],
    following: ["bob", "carol", "dave", "erin"],
  });
  await page.setInputFiles("#file", zip);

  await expect(page.locator("#screen-result")).toBeVisible();
  await expect(page.locator("#stats .stat").nth(0).locator(".n")).toHaveText("4");
  await expect(page.locator("#stats .stat").nth(1).locator(".n")).toHaveText("3");
  await expect(page.locator('[data-count="notFollowingBack"]')).toHaveText("2");
  await expect(page.locator('[data-count="fans"]')).toHaveText("1");
  await expect(page.locator('[data-count="mutual"]')).toHaveText("2");
  await expect(page.locator("#list .uname").first()).toHaveText(/@/);
});

test("two exports produce a diff: who unfollowed and who is new", async ({ page }) => {
  await page.goto("/app.html");

  // Older export: leftme follows, nobody special in following.
  await page.setInputFiles("#file", await buildZip({
    followers: ["alice", "bob", "leftme"],
    following: ["alice"],
  }));
  await expect(page.locator("#screen-result")).toBeVisible();

  // Newer export: leftme is gone from followers, newfriend was newly followed.
  await page.click("#new-export");
  await page.setInputFiles("#file", await buildZip({
    followers: ["alice", "bob"],
    following: ["alice", "newfriend"],
  }));
  await expect(page.locator("#screen-result")).toBeVisible();

  const history = page.locator("#history-panel");
  await history.locator("summary").click();
  await expect(page.locator("#history-badge")).toHaveText("2 saved");

  const blocks = page.locator("#diff-out .diff-block");
  await expect(blocks).toHaveCount(4);
  await expect(blocks.nth(0).locator(".uname")).toHaveText(["@leftme"]);
  await expect(blocks.nth(0).locator(".diff-head .badge")).toHaveText("1");
  await expect(blocks.nth(1).locator(".diff-head .badge")).toHaveText("0");
  await expect(blocks.nth(2).locator(".diff-head .badge")).toHaveText("0");
  await expect(blocks.nth(3).locator(".uname")).toHaveText(["@newfriend"]);
});

test("the site still works in Spanish", async ({ page }) => {
  await page.goto("/app.html");
  await page.selectOption(".lang-switch", "es");
  await expect(page.locator("h1")).toHaveText("Suelta tu exportación. Obtén la lista.");

  await page.setInputFiles("#file", await buildZip({
    followers: ["alice"],
    following: ["alice", "dave"],
  }));
  await expect(page.locator("#screen-result")).toBeVisible();
  await expect(page.locator('[data-count="notFollowingBack"]')).toHaveText("1");
  await expect(page.locator("#stats .stat").first().locator(".l")).toHaveText("Seguidos");
});
