#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Run at container start by the nginx image's entrypoint (/docker-entrypoint.d/), before nginx reads its configuration.
# Writes two files in /tmp (OSTROM_SITE_CONFIG_DIR):
# - site-config.json, the page's run-time settings, from OSTROM_POSTHOG_API_KEY and OSTROM_POSTHOG_HOST. Without a key
#   the site shows no cookie banner and loads no analytics.
# - ostrom-csp.conf, the Content-Security-Policy header nginx adds: the directives a <meta> cannot carry, and the hosts
#   the pages may connect to. The pages' own policy allows any https host (scripts/lib/csp.ts); this header narrows it to
#   the site, the console and the API (written at build in OSTROM_CONNECT_SRC_FILE), and the analytics host.
# Anything that is not a plain key or an http(s) origin is dropped, so neither file can be broken by a value. Without
# the build's origins the container does not start: a page served without its connect-src would connect anywhere.
set -euf
dir="${OSTROM_SITE_CONFIG_DIR:-/tmp}"
connect_file="${OSTROM_CONNECT_SRC_FILE:-/etc/nginx/ostrom-connect-src.txt}"
key="${OSTROM_POSTHOG_API_KEY:-}"
host="${OSTROM_POSTHOG_HOST:-https://eu.i.posthog.com}"
case "$key" in *[!A-Za-z0-9_-]*) key="" ;; esac
case "$host" in https://*) ;; *) host="" ;; esac
case "$host" in *[!A-Za-z0-9.:/_-]*) host="" ;; esac
printf '{"posthogKey":"%s","posthogHost":"%s"}\n' "$key" "$host" > "$dir/site-config.json"

if [ ! -r "$connect_file" ]; then
  echo "site-config: $connect_file is missing (written at image build): refusing to start without a connect-src" >&2
  exit 1
fi
connect="'self'"
for source in $(cat "$connect_file") $host; do
  case "$source" in http://* | https://*) ;; *) continue ;; esac
  origin=$(printf '%s' "$source" | sed -E 's#^(https?://[^/?#]+).*#\1#')
  case "$origin" in *[!A-Za-z0-9.:/_-]*) continue ;; esac
  case " $connect " in *" $origin "*) continue ;; esac
  connect="$connect $origin"
done
printf 'add_header Content-Security-Policy "%s; connect-src %s" always;\n' \
  "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' mailto:" "$connect" \
  > "$dir/ostrom-csp.conf"
