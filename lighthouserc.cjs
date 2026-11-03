// SPDX-License-Identifier: Apache-2.0
// Lighthouse CI: every page of the sitemap, against the container on localhost:8080. The sitemap is LIGHTHOUSE_SITEMAP
// when set (it must exist), else out/sitemap.xml, else the container's. The profile and the budgets are in
// scripts/lib/lighthouse.ts (tested): mobile at 150 ms, 1.6 Mbit/s with a CPU slowed four times,
// LIGHTHOUSE_PROFILE=desktop for the desktop one. The audited image is built with NEXT_PUBLIC_LAUNCHED=1: Lighthouse
// checks the site as it will be once launched (indexable).
const { readFileSync, existsSync } = require('node:fs')
const { execSync } = require('node:child_process')
const { lighthouseConfig, profileOf } = require('./scripts/lib/lighthouse.ts')

function sitemapUrls() {
  // A sitemap asked for by name is read or fails: a mistyped path must not audit other pages in silence.
  if (process.env.LIGHTHOUSE_SITEMAP) return urlsOf(readFileSync(process.env.LIGHTHOUSE_SITEMAP, 'utf8'))
  const xml = existsSync('out/sitemap.xml')
    ? readFileSync('out/sitemap.xml', 'utf8')
    : execSync('curl -fsS http://localhost:8080/sitemap.xml').toString()
  return urlsOf(xml)
}

function urlsOf(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace(/^https?:\/\/[^/]+/, 'http://localhost:8080'),
  )
}

module.exports = lighthouseConfig(sitemapUrls(), profileOf(process.env))
