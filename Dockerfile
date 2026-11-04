# ostrom.run as a container: Next.js static export served by unprivileged nginx on port 8080.
# Build: docker build -t ostrom-site . ; run: docker run -p 8080:8080 ostrom-site ; probe: GET /healthz.

# The export is the same for every architecture: build it once, natively, on the build machine.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Public URLs baked into the pages (defaults: ostrom.run, app.ostrom.run, api.ostrom.run).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
# Lyes's go for the public launch: 1 opens indexing (robots, meta, X-Robots-Tag) and the links to the repositories.
ARG NEXT_PUBLIC_LAUNCHED
ENV NEXT_TELEMETRY_DISABLED=1
RUN if [ "$NEXT_PUBLIC_LAUNCHED" = "1" ]; then : > robots.inc; \
    else echo 'add_header X-Robots-Tag "noindex, nofollow" always;' > robots.inc; fi
RUN pnpm build \
  && node scripts/csp.ts --connect-src > connect-src.txt \
  && find out -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.json' -o -name '*.xml' -o -name '*.txt' \) -size +512c -exec gzip -9 -k {} \;

# nginx's stable line (1.30): a line nginx has closed (1.29 since the 1.30 release) keeps its last tag, never rebuilt.
# The tag lags Alpine's security fixes by weeks: the packages are upgraded at every build (the publish job has no
# cache). Every package the image ships is in this stage; .github/scripts/scan_image.sh scans it on each pull request.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime-base
USER root
RUN apk upgrade --no-cache
USER 101

FROM runtime-base
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/robots.inc /etc/nginx/ostrom-robots.inc
# The console and API origins of this build, for the connect-src header written at start by site-config.sh.
COPY --from=build /app/connect-src.txt /etc/nginx/ostrom-connect-src.txt
# Analytics key at run time: OSTROM_POSTHOG_API_KEY (and OSTROM_POSTHOG_HOST, EU cloud by default). None, no analytics.
COPY --chmod=755 docker/site-config.sh /docker-entrypoint.d/40-ostrom-site-config.sh
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
USER 101
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
