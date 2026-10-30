import { en } from '@/i18n/en'
import { footerColumns, headerLinks, signinUrl, signupUrl } from './navigation'
import { readSiteConfig } from './site'

const config = readSiteConfig({ NEXT_PUBLIC_APP_URL: 'https://app.example.test' })

describe('navigation', () => {
  it('opens the console sign-up, with the plan and interval when given', () => {
    expect(signupUrl(config)).toBe('https://app.example.test/signup')
    expect(signupUrl(config, { plan: 'team', interval: 'year' })).toBe(
      'https://app.example.test/signup?plan=team&interval=year',
    )
  })

  it('opens the console sign-in', () => {
    expect(signinUrl(config)).toBe('https://app.example.test/login')
  })

  it('lists internal header links', () => {
    expect(headerLinks(en).every((link) => !link.external)).toBe(true)
  })

  it('marks links that leave the site as external', () => {
    const links = footerColumns(en, config).flatMap((column) => column.links)
    const github = links.find((link) => link.href === config.githubUrl)
    expect(github?.external).toBe(true)
    expect(links.find((link) => link.href === '/#how-it-works')?.external).toBe(false)
  })
})
