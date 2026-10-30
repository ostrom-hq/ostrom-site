#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Writes /tmp/site-config.json at container start (run by the nginx image's entrypoint, /docker-entrypoint.d/), from
# OSTROM_POSTHOG_API_KEY and OSTROM_POSTHOG_HOST. Without a key the site shows no cookie banner and loads no analytics.
# Anything that is not a plain key or an https URL is dropped, so the JSON can never be broken by a value.
set -eu
key="${OSTROM_POSTHOG_API_KEY:-}"
host="${OSTROM_POSTHOG_HOST:-https://eu.i.posthog.com}"
case "$key" in *[!A-Za-z0-9_-]*) key="" ;; esac
case "$host" in https://*) ;; *) host="" ;; esac
case "$host" in *[!A-Za-z0-9.:/_-]*) host="" ;; esac
printf '{"posthogKey":"%s","posthogHost":"%s"}\n' "$key" "$host" > /tmp/site-config.json
