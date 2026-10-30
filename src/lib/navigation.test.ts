// SPDX-License-Identifier: Apache-2.0
import { en } from '@/i18n/en'
import { footerColumns, headerLinks, signinUrl, signupUrl } from './navigation'
import { readSiteConfig } from './site'

const config = readSiteConfig({ NEXT_PUBLIC_APP_URL: 'https://app.example.test', NEXT_PUBLIC_LAUNCHED: '1' })

describe('navigation', () => {
  it('opens the console sign-up, with the plan and interval when given', () => {
    expect(signupUrl(config)).toBe('https://app.example.test/signup')
    expect(signupUrl(config, { plan: 'team', interval: 'yearly' })).toBe(
      'https://app.example.test/signup?plan=team&interval=year',
    )
    expect(signupUrl(config, { plan: 'business', interval: 'monthly' })).toBe(
      'https://app.example.test/signup?plan=business&interval=month',
    )
    expect(signupUrl(config, { plan: 'free' })).toBe('https://app.example.test/signup?plan=free')
  })

  it('opens the console sign-in', () => {
    expect(signinUrl(config)).toBe('https://app.example.test/login')
  })

  it('lists internal header links, the docs among them', () => {
    expect(headerLinks(en).every((link) => !link.external)).toBe(true)
    expect(headerLinks(en).map((link) => link.href)).toContain('/docs/')
  })

  it('links the docs and the API reference from the footer', () => {
    const links = footerColumns(en, readSiteConfig({})).flatMap((column) => column.links)
    expect(links.filter((link) => link.href.startsWith('/docs/')).map((link) => link.label)).toEqual([
      en.footer.links.docs,
      en.footer.links.api,
    ])
  })

  it('marks links that leave the site as external', () => {
    const links = footerColumns(en, config).flatMap((column) => column.links)
    const github = links.find((link) => link.href === config.githubUrl)
    expect(github?.external).toBe(true)
    expect(links.find((link) => link.href === '/#how-it-works')?.external).toBe(false)
  })

  it('links to no repository before the launch, and drops the emptied column', () => {
    const before = footerColumns(en, readSiteConfig({}))
    expect(before.flatMap((column) => column.links).some((link) => link.href.includes('github.com'))).toBe(
      false,
    )
    expect(before.every((column) => column.links.length > 0)).toBe(true)
  })
})
