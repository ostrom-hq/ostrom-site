// SPDX-License-Identifier: Apache-2.0
import type { PostHog } from 'posthog-js'
import type { Mock } from 'vitest'
import {
  clearAnalyticsStorage,
  createAnalytics,
  ctaOf,
  loadRuntimeConfig,
  once,
  parseRuntimeConfig,
  POSTHOG_OPTIONS,
  type Fetcher,
  type PostHogClient,
} from './analytics'

const config = { key: 'phc_test', host: 'https://eu.i.posthog.com' }

function fakeClient(): { client: PostHogClient; capture: Mock<PostHog['capture']> } {
  const capture = vi.fn<PostHog['capture']>()
  const client: PostHogClient = {
    init: vi.fn<PostHog['init']>(),
    capture,
    opt_in_capturing: vi.fn<PostHog['opt_in_capturing']>(),
    opt_out_capturing: vi.fn<PostHog['opt_out_capturing']>(),
  }
  return { client, capture }
}

describe('runtime configuration', () => {
  it('accepts a project key and an https host only', () => {
    expect(parseRuntimeConfig({ posthogKey: 'phc_1', posthogHost: 'https://eu.i.posthog.com' })).toEqual({
      key: 'phc_1',
      host: 'https://eu.i.posthog.com',
    })
    expect(parseRuntimeConfig({ posthogKey: '', posthogHost: 'https://eu.i.posthog.com' })).toBeNull()
    expect(parseRuntimeConfig({ posthogKey: 'phc_1', posthogHost: 'http://x' })).toBeNull()
    expect(parseRuntimeConfig(null)).toBeNull()
  })

  it('reads /site-config.json, and nothing when it is missing or broken', async () => {
    const answer =
      (body: string, status = 200): Fetcher =>
      () =>
        Promise.resolve(new Response(body, { status }))
    expect(await loadRuntimeConfig(answer('{"posthogKey":"phc_1","posthogHost":"https://h"}'))).toEqual({
      key: 'phc_1',
      host: 'https://h',
    })
    expect(await loadRuntimeConfig(answer('', 404))).toBeNull()
    expect(await loadRuntimeConfig(answer('not json'))).toBeNull()
    expect(await loadRuntimeConfig(() => Promise.reject(new TypeError('offline')))).toBeNull()
  })

  it('loads once for everyone who asks', async () => {
    const load = vi.fn(() => Promise.resolve(1))
    const shared = once(load)
    expect(await shared()).toBe(1)
    expect(await shared()).toBe(1)
    expect(load).toHaveBeenCalledTimes(1)
  })
})

describe('calls to action', () => {
  it('names sign-up, pricing, docs and GitHub links, and nothing else', () => {
    const app = 'https://app.ostrom.run'
    expect(ctaOf('https://app.ostrom.run/signup?plan=team', app)).toBe('signup')
    expect(ctaOf('/pricing/', app)).toBe('pricing')
    expect(ctaOf('/docs/quickstart/', app)).toBe('docs')
    expect(ctaOf('https://github.com/ostrom-hq', app)).toBe('github')
    expect(ctaOf('/blog/', app)).toBeNull()
    expect(ctaOf('https://example.com/pricing', app)).toBeNull()
  })
})

describe('clearAnalyticsStorage', () => {
  it('removes PostHog cookies and local storage, and nothing else', () => {
    window.localStorage.setItem('ph_phc_test_posthog', '{}')
    window.localStorage.setItem('ostrom-theme', 'dark')
    document.cookie = 'ph_phc_test_posthog=1; path=/'
    document.cookie = 'other=1; path=/'
    clearAnalyticsStorage(document, window.localStorage)
    expect(window.localStorage.getItem('ph_phc_test_posthog')).toBeNull()
    expect(window.localStorage.getItem('ostrom-theme')).toBe('dark')
    expect(document.cookie).not.toContain('ph_')
    expect(document.cookie).toContain('other=1')
    document.cookie = 'other=; Max-Age=0; path=/'
  })
})

describe('createAnalytics', () => {
  it('loads nothing and sends nothing without a yes', async () => {
    const loadClient = vi.fn(() => Promise.resolve(fakeClient().client))
    const clearStorage = vi.fn()
    const analytics = createAnalytics({ config, loadClient, clearStorage })
    await analytics.update('unset', 'https://ostrom.run/', false)
    analytics.pageview('https://ostrom.run/pricing/')
    analytics.cta('signup')
    expect(loadClient).not.toHaveBeenCalled()
    expect(clearStorage).not.toHaveBeenCalled()
    await analytics.update('denied', 'https://ostrom.run/', false)
    expect(clearStorage).toHaveBeenCalledTimes(1)
  })

  it('starts PostHog on a yes, with the options of the telemetry rules, then measures', async () => {
    const { client, capture } = fakeClient()
    const analytics = createAnalytics({
      config,
      loadClient: () => Promise.resolve(client),
      clearStorage: vi.fn(),
    })
    await analytics.update('granted', 'https://ostrom.run/', true)
    expect(client.init).toHaveBeenCalledWith('phc_test', {
      ...POSTHOG_OPTIONS,
      api_host: 'https://eu.i.posthog.com',
    })
    expect(client.opt_in_capturing).toHaveBeenCalled()
    expect(capture).toHaveBeenNthCalledWith(1, 'consent_updated', { analytics: true })
    expect(capture).toHaveBeenNthCalledWith(2, '$pageview', { $current_url: 'https://ostrom.run/' })
    analytics.pageview('https://ostrom.run/pricing/')
    analytics.cta('pricing')
    expect(capture).toHaveBeenCalledWith('$pageview', { $current_url: 'https://ostrom.run/pricing/' })
    expect(capture).toHaveBeenCalledWith('cta_clicked', { cta: 'pricing' })
  })

  it('stops on a no, and starts again without loading twice', async () => {
    const { client, capture } = fakeClient()
    const loadClient = vi.fn(() => Promise.resolve(client))
    const analytics = createAnalytics({ config, loadClient, clearStorage: vi.fn() })
    await analytics.update('granted', 'https://ostrom.run/', false)
    await analytics.update('denied', 'https://ostrom.run/', false)
    expect(client.opt_out_capturing).toHaveBeenCalled()
    capture.mockClear()
    analytics.pageview('https://ostrom.run/blog/')
    expect(capture).not.toHaveBeenCalled()
    await analytics.update('granted', 'https://ostrom.run/', false)
    expect(loadClient).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith('$pageview', { $current_url: 'https://ostrom.run/' })
  })
})
