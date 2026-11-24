/**
 * Headless check that the website parser agrees with the Python CLI.
 *
 * Usage: node tests/web/run_parse.mjs <extracted-export-dir>
 * Prints the numbers the browser would show so they can be diffed against
 * `python ig_audit.py <zip>`.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { analyzeExport } from "../../docs/js/parse.js";

const root = process.argv[2];
if (!root) {
  console.error("usage: node tests/web/run_parse.mjs <extracted-export-dir>");
  process.exit(1);
}

const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!/\.(json|html)$/i.test(entry.name)) continue;
    const rel = relative(root, full).split(sep).join("/");
    files.push({ path: rel, text: await readFile(full, "utf8") });
  }
}
await walk(root);

const result = analyzeExport(files);
console.log(JSON.stringify({
  stats: result.stats,
  integrity: {
    rowsRead: result.info.integrity.rowsRead,
    duplicates: result.info.integrity.duplicates,
    rowsSkipped: result.info.integrity.rowsSkipped,
    complete: result.info.integrity.complete,
    format: result.info.format,
  },
  warnings: result.info.warnings.length,
  firstFive: result.notFollowingBack.slice(0, 5).map((a) => a.username),
}, null, 2));
