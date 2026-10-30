// Lighthouse CI: every page of the sitemap, against the container on localhost:8080. 95 is the floor in each
// category; LHCI_PRESET=desktop audits the desktop profile, mobile otherwise. The audited image is built with
// NEXT_PUBLIC_LAUNCHED=1: Lighthouse checks the site as it will be once launched (indexable).
const { readFileSync, existsSync } = require('node:fs')
const { execSync } = require('node:child_process')

function sitemapUrls() {
  const xml = existsSync('out/sitemap.xml')
    ? readFileSync('out/sitemap.xml', 'utf8')
    : execSync('curl -fsS http://localhost:8080/sitemap.xml').toString()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace(/^https?:\/\/[^/]+/, 'http://localhost:8080'),
  )
}

const desktop = process.env.LHCI_PRESET === 'desktop'
const floor = ['error', { minScore: 0.95 }]

module.exports = {
  ci: {
    collect: {
      url: sitemapUrls(),
      numberOfRuns: 1,
      settings: desktop ? { preset: 'desktop' } : {},
    },
    assert: {
      assertions: {
        'categories:performance': floor,
        'categories:accessibility': floor,
        'categories:best-practices': floor,
        'categories:seo': floor,
        // Budgets of the public bar (PB-P1). LCP: 1.8 s on desktop, 2.5 s (Core Web Vitals "good") on the throttled
        // mobile profile.
        'largest-contentful-paint': ['error', { maxNumericValue: desktop ? 1800 : 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'total-byte-weight': ['error', { maxNumericValue: 600000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: `.lighthouseci/${desktop ? 'desktop' : 'mobile'}` },
  },
}
