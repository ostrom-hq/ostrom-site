// SPDX-License-Identifier: Apache-2.0
import {
  formatUsd,
  intervals,
  isPaidPlan,
  monthlyPriceCents,
  paidPriceCents,
  yearlyPriceCents,
} from './pricing'

describe('pricing', () => {
  it('offers yearly first, then monthly, under the names sent to sign-up', () => {
    expect(intervals).toEqual(['yearly', 'monthly'])
  })

  it('charges per active person per month', () => {
    expect(monthlyPriceCents('free', 'monthly')).toBe(0)
    expect(monthlyPriceCents('team', 'monthly')).toBe(3500)
    expect(monthlyPriceCents('business', 'monthly')).toBe(6500)
    expect(monthlyPriceCents('enterprise', 'monthly')).toBeNull()
  })

  it('takes 20 % off when billed yearly, like the Stripe catalog', () => {
    expect(monthlyPriceCents('team', 'yearly')).toBe(2800)
    expect(monthlyPriceCents('business', 'yearly')).toBe(5200)
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

  it('changes the price with the interval for Team and Business only', () => {
    expect(isPaidPlan('free')).toBe(false)
    expect(isPaidPlan('team')).toBe(true)
    expect(isPaidPlan('business')).toBe(true)
    expect(isPaidPlan('enterprise')).toBe(false)
    expect(paidPriceCents('team', 'yearly')).toBe(2800)
    expect(paidPriceCents('business', 'monthly')).toBe(6500)
  })
})
