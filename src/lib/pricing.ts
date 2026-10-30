// SPDX-License-Identifier: Apache-2.0
// The price grid decided by Lyes on 30/10/2026, mirrored from ostrom-server's billing catalog
// (modules/billing/.../Plans.kt and ops/stripe/catalog.json): Free, Team 35 USD and Business 65 USD per active person
// per month, Enterprise on quote, yearly at -20 %. A change here goes with the same change on the server.

export const planIds = ['free', 'team', 'business', 'enterprise'] as const
export type PlanId = (typeof planIds)[number]

export const intervals = ['month', 'year'] as const
export type Interval = (typeof intervals)[number]

/** Monthly list price per active person, in US cents. Null for a plan sold on quote. */
export const MONTHLY_CENTS: Readonly<Record<PlanId, number | null>> = {
  free: 0,
  team: 3500,
  business: 6500,
  enterprise: null,
}

/** Yearly billing takes 20 % off, charged up front for a committed number of people. */
export const YEARLY_DISCOUNT = 0.2

/** Price per person per month shown for an interval, in cents (yearly: the yearly price divided by 12). */
export function monthlyPriceCents(plan: PlanId, interval: Interval): number | null {
  const monthly = MONTHLY_CENTS[plan]
  if (monthly === null) return null
  return interval === 'month' ? monthly : Math.round(monthly * (1 - YEARLY_DISCOUNT))
}

/** The yearly charge per person, in cents, as Stripe bills it (Team 336 USD, Business 624 USD). */
export function yearlyPriceCents(plan: PlanId): number | null {
  const perMonth = monthlyPriceCents(plan, 'year')
  return perMonth === null ? null : perMonth * 12
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2)}`
}

/** Whether the plan is bought on the site: Free signs up, Team and Business sign up then pay with Stripe Checkout. */
export function isSelfServe(plan: PlanId): boolean {
  return plan !== 'enterprise'
}
