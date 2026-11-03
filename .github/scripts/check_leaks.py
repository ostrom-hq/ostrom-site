#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Leak guard of a public repository: nothing private reaches the tree or the commits of a pull request.

Checks, with a clear message for each hit:
  tree      every tracked text file: private paths, internal coordination names, secrets, private e-mail addresses,
            internal hosts
  commits   with --base <ref>: the author and committer e-mail of every commit since the merge base must be a GitHub
            noreply address, and the messages must pass the same patterns as the tree

Usage:
  check_leaks.py                  check the tree
  check_leaks.py --base <ref>     check the tree and the commits of the pull request
  check_leaks.py --self-test      run the rules against known good and bad samples
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys

# Built from pieces so that this file never matches its own rules.
RULES: list[tuple[str, re.Pattern[str]]] = [
    ("a coordination path", re.compile(r"\." + r"coord\b|ostrom-" + r"fusion")),
    ("a local path of a workstation", re.compile(r"/Us" + r"ers/[A-Za-z0-9._-]+|/ho" + r"me/[a-z][a-z0-9_-]+/(?:git|\.)")),
    ("an internal agent or ticket identifier", re.compile(r"\bAGENT-\d|\bSUP-\d")),
    ("another project of the team", re.compile(r"control" + r"resell", re.IGNORECASE)),
    ("a token or a key", re.compile(
        r"AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}"
        r"|whsec_[A-Za-z0-9]{10,}|xox[abprs]-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"
        r"|phc_[A-Za-z0-9]{30,}"
    )),
    ("a private e-mail address", re.compile(r"[A-Za-z0-9._%+-]+@(?:gmail|googlemail|icloud|hotmail|outlook|yahoo|proton|protonmail)\.(?:com|fr|me)\b", re.IGNORECASE)),
    ("an internal or staging host", re.compile(r"\b[a-z0-9-]+\.(?:internal|svc\.cluster\.local)\b|\bstaging[.-][a-z0-9-]+\.[a-z]{2,}\b|\b(?:10\.\d{1,3}|192\.168)\.\d{1,3}\.\d{1,3}\b")),
]

NOREPLY = re.compile(r"^(?:\d+\+)?[A-Za-z0-9-]+(?:\[bot\])?@users\.noreply\.github\.com$|^noreply@github\.com$")
SELF = {".github/scripts/check_leaks.py"}
# A private key that is public on purpose: derived from a published seed, it only signs the compatibility vectors.
PUBLIC_TEST_KEYS = {"docs-tools/vectors/key.json"}
LOCKFILES = ("pnpm-lock.yaml", "package-lock.json")


def scan(text: str) -> list[str]:
    return [label for label, rule in RULES if rule.search(text)]


def run(*args: str) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def check_tree() -> int:
    bad = 0
    for path in run("git", "ls-files", "-z").split("\0"):
        if not path or path in SELF or path in PUBLIC_TEST_KEYS or path.endswith(LOCKFILES):
            continue
        try:
            with open(path, encoding="utf-8") as handle:
                lines = handle.read().splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for number, line in enumerate(lines, 1):
            for label in scan(line):
                print(f"::error file={path},line={number}::leak guard: {label}")
                bad += 1
    return bad


def check_commits(base: str) -> int:
    bad = 0
    log = run("git", "log", "--no-merges", "--format=%H%x1f%ae%x1f%ce%x1f%B%x1e", f"{base}..HEAD")
    for entry in filter(None, (part.strip("\n") for part in log.split("\x1e"))):
        sha, author, committer, message = entry.split("\x1f", 3)
        for who, email in (("author", author), ("committer", committer)):
            if not NOREPLY.match(email):
                print(f"::error::leak guard: commit {sha[:12]} has a non-noreply {who} e-mail; set git config "
                      "user.email to your <id>+<login>@users.noreply.github.com address and amend the commit")
                bad += 1
        for label in scan(message):
            print(f"::error::leak guard: the message of commit {sha[:12]} contains {label}")
            bad += 1
    return bad


def self_test() -> int:
    good = ["Guimauve Digital SAS, Paris", "legal@ostrom.run", "phc_abc", "see docs/PUBLIC-BAR.md", "TeamCode import"]
    bad = ["/Us" + "ers/jane/git/x", ".co" + "ord/JOURNAL.md", "SU" + "P-123", "Control" + "Resell", "jane@gmail" + ".com",
           "ghp_" + "a" * 36, "-----BEGIN " + "PRIVATE KEY-----", "api.staging-x.example.com", "db.svc.cluster" + ".local"]
    failed = [s for s in good if scan(s)] + [s for s in bad if not scan(s)]
    failed += [e for e in ["1+jane@users.noreply.github.com", "noreply@github.com"] if not NOREPLY.match(e)]
    failed += [e for e in ["jane@gmail.com", "jane@ostrom.run"] if NOREPLY.match(e)]
    for item in failed:
        print(f"self-test failed on: {item!r}")
    return len(failed)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--self-test", action="store_true")
    options = parser.parse_args()
    if options.self_test:
        sys.exit(1 if self_test() else 0)
    total = check_tree() + (check_commits(options.base) if options.base else 0)
    print(f"leak guard: {total} hit(s)")
    sys.exit(1 if total else 0)
