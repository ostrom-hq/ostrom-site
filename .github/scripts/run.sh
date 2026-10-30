#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
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
  # One annotation holding the last 60 lines (GitHub keeps at most 10 annotations per step).
  tail_text="$(grep -v '^[[:space:]]*$' "$log" | sed 's/\x1b\[[0-9;]*m//g' | tail -n 60)"
  tail_text="${tail_text//'%'/'%25'}"
  tail_text="${tail_text//$'\r'/'%0D'}"
  tail_text="${tail_text//$'\n'/'%0A'}"
  printf '::error title=%s::%s\n' "$title" "$tail_text"
fi
exit "$status"
