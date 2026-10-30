import { check, probes, type Fetcher } from './status'

const config = {
  siteUrl: 'https://ostrom.run',
  appUrl: 'https://app.ostrom.run',
  apiUrl: 'https://api.ostrom.run',
}
const answer =
  (init: ResponseInit & { readonly opaque?: boolean }): Fetcher =>
  () =>
    Promise.resolve(
      init.opaque === true
        ? // `type` is a read-only getter of Response: an own property shadows it.
          Object.defineProperty(new Response(null), 'type', { value: 'opaque' })
        : new Response(null, init),
    )

describe('status', () => {
  it('probes the site, the console and the API', () => {
    expect(probes(config).map((probe) => [probe.id, probe.url, probe.mode])).toEqual([
      ['site', '/healthz', 'cors'],
      ['console', 'https://app.ostrom.run/', 'no-cors'],
      ['api', 'https://api.ostrom.run/health', 'cors'],
    ])
  })

  it('is operational on a 2xx or an opaque answer, unreachable otherwise', async () => {
    const [, consoleProbe, api] = probes(config)
    if (consoleProbe === undefined || api === undefined) throw new Error('probes missing')
    expect(await check(api, answer({ status: 200 }))).toBe('operational')
    expect(await check(api, answer({ status: 503 }))).toBe('unreachable')
    expect(await check(consoleProbe, answer({ opaque: true }))).toBe('operational')
    expect(await check(api, () => Promise.reject(new TypeError('Failed to fetch')))).toBe('unreachable')
  })
})
