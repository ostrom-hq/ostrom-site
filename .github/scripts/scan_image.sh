#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Usage: .github/scripts/scan_image.sh                      the Dockerfile's runtime-base stage, rebuilt here (PRs)
#        .github/scripts/scan_image.sh <image> <platform>   a published image, as pulled for that platform (weekly)
# Scans the system packages of the site image for known vulnerabilities. The Dockerfile's `runtime-base` stage is nginx
# and its Alpine packages; the final stage only adds the static export and the nginx configuration, so this stage is
# every package the image ships. Fails on any HIGH or CRITICAL vulnerability that has a fix: a base tag frozen on a
# closed nginx line, packages left at the version of the base image's last push, or a published image older than an
# Alpine fix show up here.
# Trivy runs from its image, pinned by digest, on a saved archive (no Docker socket in the scanner).
set -euo pipefail
TRIVY='aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c'
work="$(mktemp -d "${RUNNER_TEMP:-/tmp}/scan.XXXXXX")"
trap 'rm -rf "$work"' EXIT
if [ "$#" -eq 2 ]; then
  # One platform per run: the pull leaves that variant under the tag, which is what is saved.
  docker pull --quiet --platform "$2" "$1"
  docker save --output "$work/image.tar" "$1"
else
  docker build --quiet --target runtime-base --tag ostrom-site:runtime-base .
  docker save --output "$work/image.tar" ostrom-site:runtime-base
fi
# Exit code 2 means findings. Any other failure is the scanner's own (its database download, a registry's rate limit):
# tried three times, then said apart, so a network error is not read as a vulnerability.
for attempt in 1 2 3; do
  status=0
  docker run --rm --volume "$work:/scan:ro" "$TRIVY" image --quiet --input /scan/image.tar \
    --scanners vuln --pkg-types os --severity HIGH,CRITICAL --ignore-unfixed --exit-code 2 || status=$?
  case "$status" in
    0) exit 0 ;;
    2)
      echo "The image ships a HIGH or CRITICAL vulnerability that has a fix (table above, full list in the log)." >&2
      exit 1
      ;;
  esac
  echo "The scanner itself failed (exit $status, attempt $attempt of 3)." >&2
  sleep $((attempt * 20))
done
echo "The scanner failed three times: no verdict on the image." >&2
exit "$status"
