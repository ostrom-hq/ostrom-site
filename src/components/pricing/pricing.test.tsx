// SPDX-License-Identifier: Apache-2.0
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Messages } from '@/i18n'
import { en } from '@/i18n/en'
import { readSiteConfig } from '@/lib/site'
import { ComparePlans, PricingFaq } from './PricingDetails'
import { PricingTable } from './PricingTable'

const config = readSiteConfig({})
const copy: Messages['pricing'] = en.pricing

const hrefs = (name: string): readonly (string | null)[] =>
  screen.getAllByRole('link', { name }).map((link) => link.getAttribute('href'))

describe('PricingTable', () => {
  it('checks yearly in the markup, with a visible legend, and saves 20 %', () => {
    render(<PricingTable copy={copy} config={config} />)
    const group = screen.getByRole('group', { name: copy.intervalLabel })
    expect(within(group).getByText(copy.intervalLabel)).not.toHaveClass('visually-hidden')
    const yearly = screen.getByRole('radio', { name: `${copy.yearly} ${copy.yearlySave}` })
    expect(yearly).toBeChecked()
    expect(yearly).toHaveAttribute('id', 'interval-yearly')
    expect(screen.getByRole('radio', { name: copy.monthly })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: copy.monthly })).toHaveAttribute('id', 'interval-monthly')
    expect(copy.yearlySave).toBe('−20 %')
  })

  it('renders both intervals of each paid plan, price and note, for CSS to pick one', () => {
    render(<PricingTable copy={copy} config={config} />)
    expect(screen.getByTestId('price-team-yearly')).toHaveTextContent('$28per active person / month')
    expect(screen.getByTestId('price-team-monthly')).toHaveTextContent('$35per active person / month')
    expect(screen.getByTestId('price-business-yearly')).toHaveTextContent('$52')
    expect(screen.getByTestId('price-business-monthly')).toHaveTextContent('$65')
    expect(screen.getByTestId('price-team-yearly')).toHaveAttribute('data-interval', 'yearly')
    expect(screen.getByTestId('price-team-monthly')).toHaveAttribute('data-interval', 'monthly')
    expect(screen.getByText('billed yearly, $336 per person')).toHaveAttribute('data-interval', 'yearly')
    expect(screen.getByText('billed yearly, $624 per person')).toHaveAttribute('data-interval', 'yearly')
    expect(screen.getAllByText(copy.billedMonthly)).toHaveLength(2)
    expect(screen.getAllByText(copy.currency)).toHaveLength(2)
  })

  it('shows one price for Free and Enterprise, whatever the interval', () => {
    render(<PricingTable copy={copy} config={config} />)
    expect(screen.getByTestId('price-free')).toHaveTextContent('$0free')
    expect(screen.getByTestId('price-free')).not.toHaveAttribute('data-interval')
    expect(screen.getByTestId('price-enterprise')).toHaveTextContent('On request')
    expect(screen.getByText(copy.popular)).toBeInTheDocument()
  })

  it('gives Team and Business one real link per interval, Free its plan only, Enterprise a contact', () => {
    render(<PricingTable copy={copy} config={config} />)
    expect(hrefs(copy.plans.team.cta)).toEqual([
      'https://app.ostrom.run/signup?plan=team&interval=year',
      'https://app.ostrom.run/signup?plan=team&interval=month',
    ])
    expect(hrefs(copy.plans.business.cta)).toEqual([
      'https://app.ostrom.run/signup?plan=business&interval=year',
      'https://app.ostrom.run/signup?plan=business&interval=month',
    ])
    expect(hrefs(copy.plans.free.cta)).toEqual(['https://app.ostrom.run/signup?plan=free'])
    expect(hrefs(copy.plans.enterprise.cta)).toEqual(['mailto:hello@ostrom.run?subject=Ostrom%20Enterprise'])
    const [yearlyTeam] = screen.getAllByRole('link', { name: copy.plans.team.cta })
    expect(yearlyTeam).toHaveAttribute('data-interval', 'yearly')
  })

  it('puts yearly checked and both links of each paid plan in the static HTML', () => {
    const html = renderToStaticMarkup(<PricingTable copy={copy} config={config} />)
    expect(html).toMatch(/<input type="radio" id="interval-yearly"[^>]* checked=""/)
    expect(html).not.toMatch(/id="interval-monthly"[^>]*checked/)
    for (const plan of ['team', 'business']) {
      for (const interval of ['year', 'month']) {
        expect(html).toContain(`href="https://app.ostrom.run/signup?plan=${plan}&amp;interval=${interval}"`)
      }
    }
  })

  it('switches with the radio inputs alone, no script needed', async () => {
    const user = userEvent.setup()
    render(<PricingTable copy={copy} config={config} />)
    await user.click(screen.getByRole('radio', { name: copy.monthly }))
    expect(screen.getByRole('radio', { name: copy.monthly })).toBeChecked()
    expect(screen.getByRole('radio', { name: `${copy.yearly} ${copy.yearlySave}` })).not.toBeChecked()
  })
})

describe('ComparePlans', () => {
  it('groups the rows by See, Steer, Prove, Security and admin, Support', () => {
    render(<ComparePlans copy={copy} />)
    const table = screen.getByRole('table')
    expect(copy.compare.groups.map((group) => group.name)).toEqual([
      'See',
      'Steer',
      'Prove',
      'Security and admin',
      'Support',
    ])
    for (const group of copy.compare.groups) {
      expect(within(table).getByRole('rowheader', { name: group.name })).toHaveAttribute('scope', 'rowgroup')
    }
  })

  it('names the plans in the header and explains each row in one line', () => {
    render(<ComparePlans copy={copy} />)
    const table = screen.getByRole('table')
    const header = within(table).getAllByRole('row')[0]
    expect(header).toBeDefined()
    for (const plan of ['Free', 'Team', 'Business', 'Enterprise']) {
      expect(within(table).getByRole('columnheader', { name: plan })).toBeInTheDocument()
    }
    const rows = copy.compare.groups.flatMap((group) => group.rows)
    for (const row of rows) {
      expect(within(table).getByText(row.detail)).toHaveClass('compare__detail')
    }
    expect(within(table).getAllByRole('row')).toHaveLength(1 + copy.compare.groups.length + rows.length)
  })

  it('fills every cell with a value, a tick or a dash, never a bare cross', () => {
    render(<ComparePlans copy={copy} />)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('img', { name: copy.compare.yes }).length).toBeGreaterThan(0)
    const dashes = within(table).getAllByRole('img', { name: copy.compare.no })
    expect(dashes.length).toBeGreaterThan(0)
    expect(dashes.every((dash) => dash.textContent === '—')).toBe(true)
    expect(within(table).getByText('Up to 5')).toBeInTheDocument()
    for (const cell of within(table).getAllByRole('cell')) {
      expect(cell.textContent.trim()).not.toBe('')
      expect(cell.textContent).not.toMatch(/[✗✕×x]/u)
    }
  })
})

describe('PricingFaq', () => {
  it('opens an answer', async () => {
    const user = userEvent.setup()
    render(<PricingFaq copy={copy} />)
    const first = copy.faq.items[0]
    await user.click(screen.getByText(first.question))
    expect(screen.getByText(first.answer)).toBeVisible()
  })
})
