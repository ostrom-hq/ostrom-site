// SPDX-License-Identifier: Apache-2.0
import { render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { en } from '@/i18n/en'
import HomePage from './page'
import RootLayout, { metadata, viewport } from './layout'
import NotFound from './not-found'
import robots from './robots'
import sitemap from './sitemap'

describe('home page', () => {
  it('shows the promise and the scene of the yes on the first screen', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: en.home.hero.title })).toBeInTheDocument()
    expect(screen.getByText(en.home.hero.lead)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.approval.approve })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: en.home.hero.primary })[0]).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup',
    )
  })

  it('tells the whole story down to the last call to action', () => {
    render(<HomePage />)
    for (const title of [
      en.home.vision.title,
      en.home.problem.title,
      en.home.third.title,
      en.home.how.title,
      en.home.pillars.title,
      en.home.receipt.title,
      en.home.approvals.title,
      en.home.motif.title,
      en.home.open.title,
      en.home.why.title,
      en.home.cta.title,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: en.home.cta.secondary })).toHaveAttribute(
      'href',
      'mailto:hello@ostrom.run',
    )
    expect(document.getElementById('how-it-works')).not.toBeNull()
  })

  it('declares its canonical URL and its structured data', async () => {
    const { metadata: homeMetadata } = await import('./page')
    expect(homeMetadata.alternates).toEqual({ canonical: '/' })
    const { container } = render(<HomePage />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.textContent).toContain('"SoftwareApplication"')
  })
})

describe('root layout', () => {
  it('renders an English page with a skip link, the theme boot script, header and footer', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>child</p>
      </RootLayout>,
    )
    expect(html).toContain('<html lang="en"')
    expect(html).toContain('font-archivo')
    expect(html).toContain('href="#main"')
    expect(html).toContain('ostrom-theme')
    expect(html).toContain('<main id="main"')
    expect(html).toContain('<p>child</p>')
    expect(html).toContain(en.footer.motif)
  })

  it('declares the metadata for search and sharing', () => {
    expect(metadata.description).toBe(en.meta.description)
    expect(metadata.metadataBase?.toString()).toBe('https://ostrom.run/')
    expect(viewport.colorScheme).toBe('light dark')
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.openGraph?.images).toEqual([
      { url: '/og.png', width: 1200, height: 630, alt: en.meta.title },
    ])
  })
})

describe('not found', () => {
  it('leads back home', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.notFound.home })).toHaveAttribute('href', '/')
    const elsewhere = screen.getByRole('navigation', { name: en.notFound.elsewhere })
    expect(within(elsewhere).getByRole('link', { name: en.nav.changelog })).toHaveAttribute(
      'href',
      '/changelog/',
    )
  })
})

describe('robots and sitemap', () => {
  it('stays out of search engines until the launch: crawlable, noindex, no sitemap announced', () => {
    expect(robots()).toEqual({ rules: { userAgent: '*', allow: '/' } })
  })

  it('lists every public page with an absolute URL', () => {
    const entries = sitemap()
    expect(entries[0]?.url).toBe('https://ostrom.run/')
    expect(entries.every((entry) => entry.url.startsWith('https://ostrom.run/'))).toBe(true)
  })
})

describe('pricing page', () => {
  it('has its title, the plans, the comparison and the questions', async () => {
    const { default: PricingPage, metadata: pricingMetadata } = await import('./pricing/page')
    render(<PricingPage />)
    expect(screen.getByRole('heading', { level: 1, name: en.pricing.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: en.pricing.compare.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: en.pricing.faq.title })).toBeInTheDocument()
    expect(pricingMetadata.title).toBe('Pricing')
  })
})
