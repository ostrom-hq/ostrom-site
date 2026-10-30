import { absoluteUrl, readSiteConfig, site } from './site'

describe('readSiteConfig', () => {
  it('defaults to the production domains', () => {
    const config = readSiteConfig({})
    expect(config.siteUrl).toBe('https://ostrom.run')
    expect(config.appUrl).toBe('https://app.ostrom.run')
    expect(config.apiUrl).toBe('https://api.ostrom.run')
    expect(config.contactEmail).toBe('hello@ostrom.run')
  })

  it('takes the environment and drops trailing slashes', () => {
    const config = readSiteConfig({
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000/',
      NEXT_PUBLIC_APP_URL: 'http://localhost:5173//',
      NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    })
    expect(config.siteUrl).toBe('http://localhost:3000')
    expect(config.appUrl).toBe('http://localhost:5173')
    expect(config.apiUrl).toBe('http://localhost:8080')
  })

  it('refuses a malformed URL instead of shipping a broken link', () => {
    expect(() => readSiteConfig({ NEXT_PUBLIC_APP_URL: 'not a url' })).toThrow()
    expect(() => readSiteConfig({ NEXT_PUBLIC_APP_URL: 'javascript:alert(1)' })).toThrow()
  })

  it('is read once for the build', () => {
    expect(site.siteUrl).toMatch(/^https?:\/\//)
  })
})

describe('absoluteUrl', () => {
  const config = readSiteConfig({})
  it('joins a path with or without its leading slash', () => {
    expect(absoluteUrl('/pricing/', config)).toBe('https://ostrom.run/pricing/')
    expect(absoluteUrl('docs/', config)).toBe('https://ostrom.run/docs/')
  })
  it('uses the build configuration by default', () => {
    expect(absoluteUrl('/')).toBe(`${site.siteUrl}/`)
  })
})
