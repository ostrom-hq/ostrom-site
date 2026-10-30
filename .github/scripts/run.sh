#!/usr/bin/env bash
# Usage: .github/scripts/run.sh <title> <command...>
# Runs a CI command; when it fails, its last output lines also become error annotations of the check run, so the cause
# can be read without downloading logs (agents read checks through the GraphQL API).
set -o pipefail
title="$1"
shift
log="$(mktemp)"
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ]; then
  grep -v '^\s*$' "$log" | sed 's/\x1b\[[0-9;]*m//g' | tail -n 40 | while IFS= read -r line; do
    printf '::error title=%s::%s\n' "$title" "${line//%/%25}"
  done
fi
exit "$status"
