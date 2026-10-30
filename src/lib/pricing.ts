// SPDX-License-Identifier: Apache-2.0
// The price grid decided by Lyes on 30/10/2026, mirrored from ostrom-server's billing catalog
// (modules/billing/.../Plans.kt and ops/stripe/catalog.json): Free, Team 35 USD and Business 65 USD per active person
// per month, Enterprise on quote, yearly at -20 %. A change here goes with the same change on the server.

export const planIds = ['free', 'team', 'business', 'enterprise'] as const
export type PlanId = (typeof planIds)[number]

/** The billing intervals, yearly first (the default the page shows); the sign-up link names them month and year. */
export const intervals = ['yearly', 'monthly'] as const
export type Interval = (typeof intervals)[number]

/** The plans whose price changes with the billing interval. */
export const paidPlanIds = ['team', 'business'] as const
export type PaidPlanId = (typeof paidPlanIds)[number]

/** Monthly list price per active person of the paid plans, in US cents. */
const PAID_MONTHLY_CENTS: Readonly<Record<PaidPlanId, number>> = { team: 3500, business: 6500 }

/** Monthly list price per active person, in US cents. Null for a plan sold on quote. */
export const MONTHLY_CENTS: Readonly<Record<PlanId, number | null>> = {
  free: 0,
  ...PAID_MONTHLY_CENTS,
  enterprise: null,
}

/** Yearly billing takes 20 % off, charged up front for a committed number of people. */
export const YEARLY_DISCOUNT = 0.2

export function isPaidPlan(plan: PlanId): plan is PaidPlanId {
  return plan === 'team' || plan === 'business'
}

/** Price per person per month of a paid plan for an interval, in cents (yearly: the yearly price divided by 12). */
export function paidPriceCents(plan: PaidPlanId, interval: Interval): number {
  const monthly = PAID_MONTHLY_CENTS[plan]
  return interval === 'monthly' ? monthly : Math.round(monthly * (1 - YEARLY_DISCOUNT))
}

/** Price per person per month shown for an interval, in cents. Null for a plan sold on quote. */
export function monthlyPriceCents(plan: PlanId, interval: Interval): number | null {
  return isPaidPlan(plan) ? paidPriceCents(plan, interval) : MONTHLY_CENTS[plan]
}

/** The yearly charge per person, in cents, as Stripe bills it (Team 336 USD, Business 624 USD). */
export function yearlyPriceCents(plan: PlanId): number | null {
  const perMonth = monthlyPriceCents(plan, 'yearly')
  return perMonth === null ? null : perMonth * 12
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2)}`
}
