import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { en } from '@/i18n/en'
import { readSiteConfig } from '@/lib/site'
import { ComparePlans, PricingFaq } from './PricingDetails'
import { PricingTable } from './PricingTable'

const config = readSiteConfig({})
const copy = en.pricing

describe('PricingTable', () => {
  it('shows the four plans at their monthly price, Team highlighted', () => {
    render(<PricingTable copy={copy} config={config} />)
    expect(screen.getByTestId('price-free')).toHaveTextContent('$0free')
    expect(screen.getByTestId('price-team')).toHaveTextContent('$35per active person / month')
    expect(screen.getByTestId('price-business')).toHaveTextContent('$65')
    expect(screen.getByTestId('price-enterprise')).toHaveTextContent('Custom')
    expect(screen.getByText(copy.popular)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: copy.monthly })).toBeChecked()
  })

  it('links each plan to the console sign-up with its plan and interval', () => {
    render(<PricingTable copy={copy} config={config} />)
    expect(screen.getByRole('link', { name: copy.plans.free.cta })).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup?plan=free&interval=month',
    )
    expect(screen.getByRole('link', { name: copy.plans.team.cta })).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup?plan=team&interval=month',
    )
    expect(screen.getByRole('link', { name: copy.plans.enterprise.cta })).toHaveAttribute(
      'href',
      'mailto:hello@ostrom.run?subject=Ostrom%20Enterprise',
    )
  })

  it('switches to yearly prices, 20% off, and carries the interval to sign-up', async () => {
    const user = userEvent.setup()
    render(<PricingTable copy={copy} config={config} />)
    await user.click(screen.getByRole('radio', { name: `${copy.yearly} ${copy.yearlySave}` }))
    expect(screen.getByTestId('price-team')).toHaveTextContent('$28')
    expect(screen.getByTestId('price-business')).toHaveTextContent('$52')
    expect(screen.getByText('billed yearly, $336 per person')).toBeInTheDocument()
    expect(screen.getByText('billed yearly, $624 per person')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: copy.plans.business.cta })).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup?plan=business&interval=year',
    )
    await user.click(screen.getByRole('radio', { name: copy.monthly }))
    expect(screen.getByTestId('price-team')).toHaveTextContent('$35')
  })
})

describe('ComparePlans', () => {
  it('lays out every row with readable marks', () => {
    render(<ComparePlans copy={copy} />)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(copy.compare.rows.length + 1)
    expect(within(table).getAllByRole('img', { name: copy.compare.yes }).length).toBeGreaterThan(0)
    expect(within(table).getAllByRole('img', { name: copy.compare.no }).length).toBeGreaterThan(0)
    expect(within(table).getByText('Up to 5')).toBeInTheDocument()
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
