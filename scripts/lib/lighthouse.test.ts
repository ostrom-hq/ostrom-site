// SPDX-License-Identifier: Apache-2.0
// The Lighthouse CI profile and its budgets: what the measure means is written here, not left to Lighthouse's defaults.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lighthouseConfig, profileOf } from './lighthouse.ts'

const urls = ['http://localhost:8080/', 'http://localhost:8080/docs/']

describe('profileOf', () => {
  it('audits the mobile profile unless desktop is asked', () => {
    expect(profileOf({})).toBe('mobile')
    expect(profileOf({ LIGHTHOUSE_PROFILE: '' })).toBe('mobile')
    expect(profileOf({ LIGHTHOUSE_PROFILE: 'mobile' })).toBe('mobile')
    expect(profileOf({ LIGHTHOUSE_PROFILE: 'desktop' })).toBe('desktop')
  })

  it('refuses any other value rather than silently auditing mobile', () => {
    expect(() => profileOf({ LIGHTHOUSE_PROFILE: 'Desktop' })).toThrow(
      'LIGHTHOUSE_PROFILE=Desktop: expected mobile or desktop.',
    )
  })
})

describe('lighthouseConfig, mobile', () => {
  const { ci } = lighthouseConfig(urls, 'mobile')

  it('audits every given page, the median of three runs', () => {
    expect(ci.collect.url).toEqual(urls)
    expect(ci.collect.numberOfRuns).toBe(3)
  })

  it('pins the network and the CPU: 150 ms, 1.6 Mbit/s ("Fast 3G", Lighthouse\'s "Slow 4G"), CPU ×4, simulated', () => {
    expect(ci.collect.settings).toEqual({
      formFactor: 'mobile',
      throttlingMethod: 'simulate',
      throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    })
  })

  it('fails a page whose LCP passes 2.5 s or whose CLS passes 0.01', () => {
    const { assertions } = ci.assert
    expect(assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 2500 }])
    expect(assertions['cumulative-layout-shift']).toEqual(['error', { maxNumericValue: 0.01 }])
  })

  it('keeps the floor of 95 in each category and the weight of a page under 600 kB', () => {
    const { assertions } = ci.assert
    for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) {
      expect(assertions[`categories:${category}`]).toEqual(['error', { minScore: 0.95 }])
    }
    expect(assertions['total-byte-weight']).toEqual(['error', { maxNumericValue: 600000 }])
  })

  it('fails a page that ships more than 260 kB of JavaScript over the wire (gzip)', () => {
    expect(ci.assert.assertions['resource-summary:script:size']).toEqual([
      'error',
      { maxNumericValue: 266240 },
    ])
  })

  it('writes its reports apart from the desktop ones', () => {
    expect(ci.upload).toEqual({ target: 'filesystem', outputDir: 'lighthouse-reports/mobile' })
  })
})

describe('lighthouseConfig, desktop', () => {
  const { ci } = lighthouseConfig(urls, 'desktop')

  it('pins the desktop preset at 40 ms, 10 Mbit/s, CPU as is, one run, and an LCP of 1.8 s', () => {
    expect(ci.collect.numberOfRuns).toBe(1)
    expect(ci.collect.settings).toEqual({
      preset: 'desktop',
      throttlingMethod: 'simulate',
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    })
    expect(ci.assert.assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 1800 }])
    expect(ci.upload.outputDir).toBe('lighthouse-reports/desktop')
  })
})

describe('lighthouserc.cjs', () => {
  // lhci requires the rc file with Node itself: a child Node loads it the same way, so a lighthouse.ts Node cannot
  // strip, or a broken rc file, fails here rather than in the slow Lighthouse job.
  const load = (profile: string): unknown => {
    const dir = mkdtempSync(join(tmpdir(), 'lighthouserc-'))
    const sitemap = join(dir, 'sitemap.xml')
    writeFileSync(
      sitemap,
      '<urlset><url><loc>https://ostrom.run/</loc></url><url><loc>https://ostrom.run/docs/</loc></url></urlset>',
    )
    try {
      const printed = execFileSync(
        process.execPath,
        [
          '-e',
          'process.stdout.write(JSON.stringify(require(process.argv[1])))',
          join(process.cwd(), 'lighthouserc.cjs'),
        ],
        { env: { ...process.env, LIGHTHOUSE_SITEMAP: sitemap, LIGHTHOUSE_PROFILE: profile }, stdio: 'pipe' },
      )
      const config: unknown = JSON.parse(printed.toString())
      return config
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  it('audits the sitemap on the local container, with the profile asked', () => {
    expect(load('mobile')).toEqual(lighthouseConfig(urls, 'mobile'))
    expect(load('desktop')).toEqual(lighthouseConfig(urls, 'desktop'))
  })

  it('fails on a sitemap asked for by name that does not exist, rather than auditing other pages', () => {
    const missing = join(tmpdir(), 'lighthouserc-missing', 'sitemap.xml')
    expect(() =>
      execFileSync(
        process.execPath,
        ['-e', 'require(process.argv[1])', join(process.cwd(), 'lighthouserc.cjs')],
        {
          env: { ...process.env, LIGHTHOUSE_SITEMAP: missing },
          stdio: 'pipe',
        },
      ),
    ).toThrow(/ENOENT/)
  })
})
