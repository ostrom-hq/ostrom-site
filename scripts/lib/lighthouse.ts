// SPDX-License-Identifier: Apache-2.0
// Lighthouse CI: the profile each page is measured with and the budgets it must keep. lighthouserc.cjs lists the pages
// (the sitemap) and hands them here.

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
 * The mobile measure, pinned rather than left to Lighthouse's default (a Lighthouse or lhci upgrade could move it under
 * the budgets without a word): DevTools' "Fast 3G" network, which Lighthouse 12 calls "Slow 4G" — 150 ms round trip,
 * 1.6 Mbit/s down, 750 kbit/s up — and a CPU slowed four times. Simulated: Lighthouse loads the page unthrottled and
 * computes the timings on that network, which keeps a shared CI runner's noise out of them. The request-level values
 * are what Lighthouse's own preset gives DevTools throttling (latency ×3.75, throughput ×0.9).
 */
export const MOBILE_SETTINGS = {
  formFactor: 'mobile',
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
    cpuSlowdownMultiplier: 4,
  },
} as const

/** LIGHTHOUSE_PROFILE=desktop audits the desktop profile, mobile otherwise (not LHCI_*: lhci reads those itself). */
export function profileOf(env: Record<string, string | undefined>): Profile {
  return env['LIGHTHOUSE_PROFILE'] === 'desktop' ? 'desktop' : 'mobile'
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
        settings: desktop ? { preset: 'desktop' } : MOBILE_SETTINGS,
      },
      assert: {
        assertions: {
          'categories:performance': floor,
          'categories:accessibility': floor,
          'categories:best-practices': floor,
          'categories:seo': floor,
          // Budgets of the public bar (PB-P1): LCP 1.8 s on desktop, 2.5 s (Core Web Vitals "good") on the throttled
          // mobile profile.
          'largest-contentful-paint': ['error', { maxNumericValue: desktop ? 1800 : 2500 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
          'total-byte-weight': ['error', { maxNumericValue: 600000 }],
        },
      },
      upload: { target: 'filesystem', outputDir: `lighthouse-reports/${profile}` },
    },
  }
}
