// SPDX-License-Identifier: Apache-2.0
// The Lighthouse CI profile and its budgets: what the measure means is written here, not left to Lighthouse's defaults.
import { lighthouseConfig, profileOf } from './lighthouse.ts'

const urls = ['http://localhost:8080/', 'http://localhost:8080/docs/']

describe('profileOf', () => {
  it('audits the mobile profile unless desktop is asked', () => {
    expect(profileOf({})).toBe('mobile')
    expect(profileOf({ LIGHTHOUSE_PROFILE: 'mobile' })).toBe('mobile')
    expect(profileOf({ LIGHTHOUSE_PROFILE: 'desktop' })).toBe('desktop')
  })
})

describe('lighthouseConfig, mobile', () => {
  const { ci } = lighthouseConfig(urls, 'mobile')

  it('audits every given page, the median of three runs', () => {
    expect(ci.collect.url).toEqual(urls)
    expect(ci.collect.numberOfRuns).toBe(3)
  })

  it('pins the network and the CPU: "Fast 3G" (150 ms, 1.6 Mbit/s), CPU slowed four times, simulated', () => {
    expect(ci.collect.settings).toEqual({
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
    })
  })

  it('fails a page whose LCP passes 2.5 s or whose CLS passes 0.1', () => {
    const { assertions } = ci.assert
    expect(assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 2500 }])
    const [level, budget] = assertions['cumulative-layout-shift'] ?? []
    expect(level).toBe('error')
    expect(budget && 'maxNumericValue' in budget ? budget.maxNumericValue : Infinity).toBeLessThanOrEqual(0.1)
  })

  it('keeps the floor of 95 in each category and the weight of a page under 600 kB', () => {
    const { assertions } = ci.assert
    for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) {
      expect(assertions[`categories:${category}`]).toEqual(['error', { minScore: 0.95 }])
    }
    expect(assertions['total-byte-weight']).toEqual(['error', { maxNumericValue: 600000 }])
  })

  it('writes its reports apart from the desktop ones', () => {
    expect(ci.upload).toEqual({ target: 'filesystem', outputDir: 'lighthouse-reports/mobile' })
  })
})

describe('lighthouseConfig, desktop', () => {
  const { ci } = lighthouseConfig(urls, 'desktop')

  it('uses the desktop preset, one run, and an LCP of 1.8 s', () => {
    expect(ci.collect.numberOfRuns).toBe(1)
    expect(ci.collect.settings).toEqual({ preset: 'desktop' })
    expect(ci.assert.assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 1800 }])
    expect(ci.upload.outputDir).toBe('lighthouse-reports/desktop')
  })
})
