// SPDX-License-Identifier: Apache-2.0
import { formatUsd, isSelfServe, monthlyPriceCents, yearlyPriceCents } from './pricing'

describe('pricing', () => {
  it('charges per active person per month', () => {
    expect(monthlyPriceCents('free', 'month')).toBe(0)
    expect(monthlyPriceCents('team', 'month')).toBe(3500)
    expect(monthlyPriceCents('business', 'month')).toBe(6500)
    expect(monthlyPriceCents('enterprise', 'month')).toBeNull()
  })

  it('takes 20 % off when billed yearly, like the Stripe catalog', () => {
    expect(monthlyPriceCents('team', 'year')).toBe(2800)
    expect(monthlyPriceCents('business', 'year')).toBe(5200)
    expect(yearlyPriceCents('team')).toBe(33600)
    expect(yearlyPriceCents('business')).toBe(62400)
    expect(yearlyPriceCents('free')).toBe(0)
    expect(yearlyPriceCents('enterprise')).toBeNull()
  })

  it('formats dollars without cents when round', () => {
    expect(formatUsd(3500)).toBe('$35')
    expect(formatUsd(0)).toBe('$0')
    expect(formatUsd(2850)).toBe('$28.50')
  })

  it('sells every plan but Enterprise on the site', () => {
    expect(isSelfServe('free')).toBe(true)
    expect(isSelfServe('team')).toBe(true)
    expect(isSelfServe('business')).toBe(true)
    expect(isSelfServe('enterprise')).toBe(false)
  })
})
