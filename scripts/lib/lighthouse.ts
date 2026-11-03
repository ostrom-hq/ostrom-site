// SPDX-License-Identifier: Apache-2.0
// Lighthouse CI: the profile each page is measured with and the budgets it must keep. lighthouserc.cjs lists the pages
// (the sitemap) and hands them here. Node loads this file from lighthouserc.cjs by stripping its types: keep it to
// erasable syntax, without top-level await (lighthouse.test.ts loads the rc file to prove it).

export type Profile = 'mobile' | 'desktop'

export type Assertion = ['error', { minScore: number } | { maxNumericValue: number }]

export interface LighthouseConfig {
  ci: {
    collect: { url: string[]; numberOfRuns: number; settings: Record<string, unknown> }
    assert: { assertions: Record<string, Assertion> }
    upload: { target: 'filesystem'; outputDir: string }
  }
}

/**
 * The measure, pinned rather than left to Lighthouse's defaults, which a Lighthouse or lhci upgrade could move under
 * the budgets without a word. The values are Lighthouse 12's own (`throttling.mobileSlow4G`, `desktopDense4G`): pinning
 * changes nothing measured today, it keeps the measure from changing.
 *
 * Mobile: "Slow 4G" for Lighthouse 12, "Fast 3G" in DevTools until 2024 — 150 ms round trip, 1.6 Mbit/s — and a CPU
 * slowed four times. Desktop: 40 ms, 10 Mbit/s, CPU as is. Both simulated: Lighthouse loads the page unthrottled and
 * computes the timings on that network, which keeps a shared CI runner's noise out of them (the request-level
 * throttling values only apply to DevTools throttling, so they are not set).
 */
function settingsOf(profile: Profile): Record<string, unknown> {
  return profile === 'desktop'
    ? {
        preset: 'desktop',
        throttlingMethod: 'simulate',
        throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      }
    : {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
      }
}

/**
 * LIGHTHOUSE_PROFILE=desktop audits the desktop profile, unset or `mobile` the mobile one (not LHCI_*: lhci reads those
 * itself). Any other value is refused: a typo would otherwise run mobile twice and never enforce the desktop budget.
 */
export function profileOf(env: Record<string, string | undefined>): Profile {
  const value = env['LIGHTHOUSE_PROFILE']
  if (value === undefined || value === '' || value === 'mobile') return 'mobile'
  if (value === 'desktop') return 'desktop'
  throw new Error(`LIGHTHOUSE_PROFILE=${value}: expected mobile or desktop.`)
}

export function lighthouseConfig(urls: string[], profile: Profile): LighthouseConfig {
  const desktop = profile === 'desktop'
  const floor: Assertion = ['error', { minScore: 0.95 }]
  return {
    ci: {
      collect: {
        url: urls,
        // Mobile: the median of three runs, a single run on a shared CI runner swings by several points. Desktop has
        // the margin for one.
        numberOfRuns: desktop ? 1 : 3,
        settings: settingsOf(profile),
      },
      assert: {
        assertions: {
          'categories:performance': floor,
          'categories:accessibility': floor,
          'categories:best-practices': floor,
          'categories:seo': floor,
          // Budgets of the public bar (PB-P1): LCP 1.8 s on desktop, 2.5 s (Core Web Vitals "good") on the throttled
          // mobile profile; CLS 0.01, ten times under the "good" 0.1.
          'largest-contentful-paint': ['error', { maxNumericValue: desktop ? 1800 : 2500 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
          'total-byte-weight': ['error', { maxNumericValue: 600000 }],
          // JavaScript over the wire (gzip), every page: 260 kB, the measure of 03/11 (236 kB on /, 242 kB at most)
          // plus 10 %. It is React's and Next.js's runtime; the bar keeps it from growing (PUBLIC-BAR.md, PB-P1).
          'resource-summary:script:size': ['error', { maxNumericValue: 260 * 1024 }],
        },
      },
      upload: { target: 'filesystem', outputDir: `lighthouse-reports/${profile}` },
    },
  }
}
