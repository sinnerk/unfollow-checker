from __future__ import annotations

import contextlib
import csv
import io
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

import ig_audit

TIMESTAMP = 1_700_000_000


def follower_record(username: str) -> dict:
    return {
        "string_list_data": [
            {
                "href": f"https://www.instagram.com/{username}/",
                "value": username,
                "timestamp": TIMESTAMP,
            }
        ]
    }


def following_record(username: str) -> dict:
    return {
        "title": username,
        "string_list_data": [
            {
                "href": f"https://www.instagram.com/{username}/",
                "value": username,
                "timestamp": TIMESTAMP,
            }
        ],
    }


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def default_folder(root: Path) -> Path:
    return root / "connections" / "followers_and_following"


def write_followers(path: Path, usernames: list[str]) -> None:
    write_json(path, [follower_record(name) for name in usernames])


def write_following(path: Path, usernames: list[str]) -> None:
    write_json(
        path,
        {"relationships_following": [following_record(name) for name in usernames]},
    )


def make_export(
    root: Path,
    followers: list[str],
    following: list[str],
) -> Path:
    folder = default_folder(root)
    write_followers(folder / "followers_1.json", followers)
    write_following(folder / "following.json", following)
    return root


def usernames(accounts: list[dict]) -> list[str]:
    return [account["username"] for account in accounts]


class DiffTests(unittest.TestCase):
    def test_compute_diff_sections(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            prev = make_export(
                Path(tmp) / "prev",
                followers=["alice", "LeftMe", "renamegone"],
                following=["alice", "dropped"],
            )
            cur = make_export(
                Path(tmp) / "cur",
                followers=["alice", "leftme", "newfan"],
                following=["alice", "newfriend"],
            )
            prev_lists = ig_audit.load_export(prev)[:2]
            cur_lists = ig_audit.load_export(cur)[:2]
            diff = ig_audit.compute_diff(prev_lists, cur_lists)
            self.assertEqual(usernames(diff["unfollowedYou"]), ["renamegone"])
            self.assertEqual(usernames(diff["newFollowers"]), ["newfan"])
            self.assertEqual(usernames(diff["youUnfollowed"]), ["dropped"])
            self.assertEqual(usernames(diff["newlyFollowed"]), ["newfriend"])

    def test_compute_diff_same_export_is_empty(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            export = make_export(
                Path(tmp),
                followers=["alice", "bob"],
                following=["alice"],
            )
            lists = ig_audit.load_export(export)[:2]
            diff = ig_audit.compute_diff(lists, lists)
            for section in ("unfollowedYou", "newFollowers", "youUnfollowed", "newlyFollowed"):
                self.assertEqual(diff[section], [])

    def test_main_with_diff_writes_csv_and_summary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prev = make_export(
                root / "prev",
                followers=["alice", "leftme"],
                following=["alice", "dropped"],
            )
            cur = make_export(root / "cur", followers=["alice"], following=["alice"])
            out = root / "out" / "report.html"
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                rc = ig_audit.main([str(cur), "--out", str(out), "--diff", str(prev)])
            self.assertEqual(rc, 0)
            self.assertIn("leftme", stdout.getvalue())
            self.assertIn("dropped", stdout.getvalue())
            diff_csv = Path(str(out.with_suffix("")) + "_diff.csv")
            self.assertTrue(diff_csv.exists())
            rows = diff_csv.read_text(encoding="utf-8-sig")
            self.assertIn("unfollowedYou,leftme", rows)
            self.assertIn("youUnfollowed,dropped", rows)


class ParserTests(unittest.TestCase):
    def test_current_export_format(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary),
                followers=["alice", "charlie", "drew", "Zoe"],
                following=["alice", "bob", "charlie", "drew", "Eve_99"],
            )

            payload = ig_audit.build_payload(export)

            self.assertEqual(payload["counts"]["following"], 5)
            self.assertEqual(payload["counts"]["followers"], 4)
            self.assertEqual(payload["counts"]["notFollowingBack"], 2)
            self.assertEqual(payload["counts"]["fans"], 1)
            self.assertEqual(payload["counts"]["mutual"], 3)
            self.assertEqual(usernames(payload["notFollowingBack"]), ["bob", "Eve_99"])
            self.assertEqual(usernames(payload["fans"]), ["Zoe"])

    def test_record_with_value_and_href_counts_once(self) -> None:
        record = follower_record("alice")
        self.assertEqual(ig_audit.extract_entries(record), [("alice", TIMESTAMP)])

    def test_integrity_counts_one_row_per_account(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary),
                followers=["alice", "bob"],
                following=["alice", "bob", "carol"],
            )

            integrity = ig_audit.build_payload(export)["integrity"]

            self.assertEqual(integrity["rowsRead"], 5)
            self.assertEqual(integrity["duplicates"], 0)
            self.assertEqual(integrity["rowsSkipped"], 0)
            self.assertEqual(integrity["missingTimestamps"], 0)
            self.assertEqual(integrity["followers"], 2)
            self.assertEqual(integrity["following"], 3)
            self.assertTrue(integrity["complete"])

    def test_repeated_records_are_reported_as_duplicates(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary),
                followers=["alice", "alice"],
                following=["alice"],
            )

            integrity = ig_audit.build_payload(export)["integrity"]

            self.assertEqual(integrity["rowsRead"], 3)
            self.assertEqual(integrity["duplicates"], 1)
            self.assertEqual(integrity["followers"], 1)

    def test_reads_all_split_follower_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_followers(folder / "followers_1.json", ["alice", "casey"])
            write_followers(folder / "followers_2.json", ["drew"])
            write_following(folder / "following.json", ["alice", "bo", "casey", "drew"])

            payload = ig_audit.build_payload(root)

            self.assertEqual(payload["counts"]["followers"], 3)
            self.assertEqual(usernames(payload["notFollowingBack"]), ["bo"])

    def test_reads_split_following_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_followers(folder / "followers_1.json", ["alice", "bob", "carol"])
            write_following(folder / "following_1.json", ["alice"])
            write_following(folder / "following_2.json", ["bob", "carol"])

            payload = ig_audit.build_payload(root)

            self.assertEqual(payload["counts"]["following"], 3)
            self.assertEqual(payload["counts"]["notFollowingBack"], 0)

    def test_reads_combined_relationships_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            write_json(
                root / "connections.json",
                {
                    "relationships_followers": [
                        follower_record("alice"),
                        follower_record("bob"),
                    ],
                    "relationships_following": [
                        following_record("alice"),
                        following_record("carol"),
                    ],
                },
            )

            payload = ig_audit.build_payload(root)

            self.assertEqual(usernames(payload["notFollowingBack"]), ["carol"])
            self.assertEqual(usernames(payload["mutual"]), ["alice"])

    def test_threads_following_file_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_json(folder / "followers_1.json", [follower_record("alice")])
            write_json(
                folder / "following.json",
                {"relationships_following": [following_record("bob")]},
            )
            threads = root / "your_instagram_activity" / "threads"
            threads.mkdir(parents=True)
            write_json(
                threads / "following.json",
                [{"title": "thread.account", "string_list_data": [{"timestamp": TIMESTAMP}]}],
            )
            following, followers = ig_audit.load_follow_lists(root)
            self.assertEqual(sorted(following), ["bob"])
            self.assertEqual(sorted(followers), ["alice"])

    def test_url_only_records_and_old_mobile_links(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_json(
                folder / "followers_1.json",
                [
                    {
                        "string_list_data": [
                            {
                                "href": "https://www.instagram.com/_u/alice/?hl=en",
                                "timestamp": TIMESTAMP,
                            }
                        ]
                    }
                ],
            )
            write_json(
                folder / "following.json",
                {
                    "relationships_following": [
                        {"title": "alice"},
                        {"title": "bob"},
                    ]
                },
            )

            payload = ig_audit.build_payload(root)

            self.assertEqual(usernames(payload["notFollowingBack"]), ["bob"])
            self.assertEqual(usernames(payload["mutual"]), ["alice"])

    def test_case_insensitive_and_duplicate_safe(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary),
                followers=["Alice", "alice", "BOB"],
                following=["alice", "bob", "Bob"],
            )

            payload = ig_audit.build_payload(export)

            self.assertEqual(payload["counts"]["followers"], 2)
            self.assertEqual(payload["counts"]["following"], 2)
            self.assertEqual(payload["counts"]["notFollowingBack"], 0)
            self.assertEqual(payload["counts"]["mutual"], 2)

    def test_empty_follower_list_is_valid(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary), followers=[], following=["alice", "bob"]
            )

            payload = ig_audit.build_payload(export)

            self.assertEqual(payload["counts"]["notFollowingBack"], 2)
            self.assertEqual(usernames(payload["notFollowingBack"]), ["alice", "bob"])

    def test_sorted_case_insensitively(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary),
                followers=[],
                following=["Zoe", "alice", "Bob", "_carol"],
            )

            payload = ig_audit.build_payload(export)

            self.assertEqual(
                usernames(payload["notFollowingBack"]),
                ["_carol", "alice", "Bob", "Zoe"],
            )

    def test_missing_relationship_list_raises(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_followers(folder / "followers_1.json", ["alice"])

            with self.assertRaises(ig_audit.AuditError):
                ig_audit.build_payload(root)

    def test_zip_input(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            write_followers(folder / "followers_1.json", ["alice", "bob"])
            write_following(folder / "following.json", ["alice", "carol"])
            archive_path = root / "export.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                for path in folder.rglob("*.json"):
                    archive.write(path, path.relative_to(root).as_posix())

            payload = ig_audit.build_payload(archive_path)

            self.assertEqual(payload["source"], "export.zip")
            self.assertEqual(usernames(payload["notFollowingBack"]), ["carol"])

    def test_bad_path_raises(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "not-json.txt").write_text("hello", encoding="utf-8")

            with self.assertRaises(ig_audit.AuditError):
                ig_audit.build_payload(root)


def html_entry(
    username: str,
    stamp: str = "Nov 18, 2026 11:11 am",
    mobile: bool = False,
    url_label: bool = False,
) -> str:
    href = (
        f"https://www.instagram.com/_u/{username}"
        if mobile
        else f"https://www.instagram.com/{username}"
    )
    label = href if url_label else username
    return (
        '<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><div class="_a6-p">'
        f'<div><div><a target="_blank" href="{href}">{label}</a></div>'
        f"<div>{stamp}</div></div></div></div>"
    )


def html_page(title: str, rows: list[str]) -> str:
    return (
        f"<html><head><title>{title}</title></head><body><h1>{title}</h1><main>"
        + "".join(rows)
        + "</main></body></html>"
    )


class HtmlExportTests(unittest.TestCase):
    def test_html_export_is_supported(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            folder.mkdir(parents=True)
            (folder / "followers_1.html").write_text(
                html_page("Followers", [html_entry("alice"), html_entry("zoe")]),
                encoding="utf-8",
            )
            (folder / "following.html").write_text(
                html_page(
                    "Following",
                    [html_entry("alice", mobile=True), html_entry("bob", mobile=True)],
                ),
                encoding="utf-8",
            )

            payload = ig_audit.build_payload(root)

            self.assertEqual(payload["format"], "html")
            self.assertEqual(payload["counts"]["followers"], 2)
            self.assertEqual(payload["counts"]["following"], 2)
            self.assertEqual(payload["counts"]["notFollowingBack"], 1)
            self.assertEqual(usernames(payload["notFollowingBack"]), ["bob"])

    def test_html_export_with_url_link_text(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            folder.mkdir(parents=True)
            (folder / "followers_1.html").write_text(
                html_page("Followers", [html_entry("alice"), html_entry("bob")]),
                encoding="utf-8",
            )
            (folder / "following.html").write_text(
                html_page(
                    "Following",
                    [
                        html_entry("alice", mobile=True, url_label=True),
                        html_entry("bob", mobile=True, url_label=True),
                        html_entry("carol", mobile=True, url_label=True),
                        '<a href="https://www.instagram.com/"><img src="logo.png" alt="Instagram"></a>',
                    ],
                ),
                encoding="utf-8",
            )

            payload = ig_audit.build_payload(root)

            self.assertEqual(payload["counts"]["following"], 3)
            self.assertEqual(payload["counts"]["followers"], 2)
            self.assertEqual(usernames(payload["notFollowingBack"]), ["carol"])

    def test_threads_following_page_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            folder.mkdir(parents=True)
            (folder / "followers_1.html").write_text(
                html_page("Followers", [html_entry("alice")]), encoding="utf-8"
            )
            (folder / "following.html").write_text(
                html_page("Following", [html_entry("alice", mobile=True)]),
                encoding="utf-8",
            )
            threads = root / "your_instagram_activity" / "threads"
            threads.mkdir(parents=True)
            (threads / "following.html").write_text(
                html_page("Threads following", [html_entry("ghost")]),
                encoding="utf-8",
            )

            payload = ig_audit.build_payload(root)

            self.assertEqual(payload["counts"]["following"], 1)
            self.assertEqual(payload["counts"]["notFollowingBack"], 0)

    def test_truncated_html_export_warns(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = default_folder(root)
            folder.mkdir(parents=True)
            (folder / "followers_1.html").write_text(
                html_page("Followers", [html_entry("alice")]), encoding="utf-8"
            )
            (folder / "following.html").write_text(
                html_page("Following", [html_entry("bob", mobile=True)]),
                encoding="utf-8",
            )
            insights = root / "logged_information" / "past_instagram_insights"
            insights.mkdir(parents=True)
            (insights / "audience_insights.html").write_text(
                "<table><tr><td>Followers</td><td>2,465</td></tr></table>",
                encoding="utf-8",
            )

            payload = ig_audit.build_payload(root)

            self.assertIsNotNone(payload["truncation"])
            self.assertEqual(payload["truncation"]["reportedFollowers"], 2465)
            self.assertEqual(payload["truncation"]["listedFollowers"], 1)
            self.assertTrue(payload["warnings"])
            self.assertIn("2,465", payload["warnings"][0])

    def test_complete_export_has_no_truncation_warning(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(
                Path(temporary), followers=["alice", "bob"], following=["alice", "bob"]
            )

            payload = ig_audit.build_payload(export)

            self.assertEqual(payload["format"], "json")
            self.assertIsNone(payload["truncation"])
            self.assertEqual(payload["warnings"], [])

    def test_reported_follower_count_parsing(self) -> None:
        self.assertEqual(
            ig_audit.parse_reported_follower_count("<td>Followers</td><td>2,465</td>"),
            2465,
        )
        self.assertIsNone(ig_audit.parse_reported_follower_count("<td>Following</td>"))


class OutputTests(unittest.TestCase):
    def test_cli_writes_all_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(
                root,
                followers=["alice", "bob"],
                following=["alice", "bob", "carol"],
            )
            out = root / "report" / "audit.html"
            stdout = io.StringIO()

            with contextlib.redirect_stdout(stdout):
                result = ig_audit.main([str(export), "--out", str(out)])

            self.assertEqual(result, 0)
            self.assertTrue(out.exists())
            self.assertIn(
                "Not following back:     1",
                stdout.getvalue(),
            )

            txt_path = root / "report" / "audit_not_following_back.txt"
            csv_path = root / "report" / "audit_accounts.csv"
            self.assertEqual(txt_path.read_text(encoding="utf-8"), "carol\n")

            with csv_path.open(encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(
                rows[0],
                {
                    "category": "not_following_back",
                    "username": "carol",
                    "profile_url": "https://www.instagram.com/carol/",
                    "timestamp_utc": "2023-11-14T22:13:20+00:00",
                },
            )

    def test_dashboard_contains_title_and_escaped_data(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(
                root,
                followers=["alice"],
                following=["alice", "bob"],
            )
            payload = ig_audit.build_payload(export)
            out = root / "audit.html"

            ig_audit.write_report(out, payload)
            document = out.read_text(encoding="utf-8")

            self.assertIn("<title>Local Instagram Unfollower</title>", document)
            self.assertIn('"username": "bob"', document)
            self.assertNotIn("</script><script>", document)

    def test_version_flag(self) -> None:
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            with self.assertRaises(SystemExit) as raised:
                ig_audit.main(["--version"])

        self.assertEqual(raised.exception.code, 0)
        self.assertIn(ig_audit.VERSION, stdout.getvalue())


if __name__ == "__main__":
    unittest.main()
