#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Usage: .github/scripts/scan_image.sh
# Scans the system layer of the site image for known vulnerabilities. The Dockerfile's `runtime-base` stage is nginx
# and its Alpine packages; the final stage only adds the static export and the nginx configuration, so this stage is
# every package the image ships. Fails on any HIGH or CRITICAL vulnerability that has a fix: a base tag frozen on a
# closed nginx line, or packages left at the version of the base image's last push, show up here.
# Trivy runs from its image, pinned by digest, on a saved archive of the stage (no Docker socket in the scanner).
set -euo pipefail
TRIVY='aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c'
work="$(mktemp -d "${RUNNER_TEMP:-/tmp}/scan.XXXXXX")"
trap 'rm -rf "$work"' EXIT
docker build --quiet --target runtime-base --tag ostrom-site:runtime-base .
docker save --output "$work/runtime-base.tar" ostrom-site:runtime-base
# Exit code 2 means findings; any other failure is the scanner's (its database download, a registry), said apart so a
# network error is not read as a vulnerability.
status=0
docker run --rm --volume "$work:/scan:ro" "$TRIVY" image --quiet --input /scan/runtime-base.tar \
  --scanners vuln --pkg-types os --severity HIGH,CRITICAL --ignore-unfixed --exit-code 2 || status=$?
case "$status" in
  0) ;;
  2) echo "The image ships a HIGH or CRITICAL vulnerability that has a fix (list above)." >&2; exit 1 ;;
  *) echo "The scanner itself failed (exit $status): no verdict on the image, run it again." >&2; exit "$status" ;;
esac
