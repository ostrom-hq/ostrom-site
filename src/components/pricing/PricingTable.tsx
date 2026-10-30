// SPDX-License-Identifier: Apache-2.0
'use client'

import { useState } from 'react'
import { format, type Messages } from '@/i18n'
import { signupUrl } from '@/lib/navigation'
import {
  formatUsd,
  intervals,
  isSelfServe,
  monthlyPriceCents,
  planIds,
  yearlyPriceCents,
  type Interval,
  type PlanId,
} from '@/lib/pricing'
import type { SiteConfig } from '@/lib/site'

interface PricingTableProps {
  readonly copy: Messages['pricing']
  readonly config: SiteConfig
}

/** The four plans with a monthly / yearly switch. Every button leads to the console's sign-up for that plan. */
export function PricingTable({ copy, config }: PricingTableProps): React.JSX.Element {
  const [interval, setBilling] = useState<Interval>('month')
  return (
    <div className="pricing">
      <fieldset className="segmented">
        <legend className="visually-hidden">{copy.intervalLabel}</legend>
        {intervals.map((value) => (
          <label key={value} className="segmented__option">
            <input
              type="radio"
              name="interval"
              value={value}
              checked={interval === value}
              onChange={() => {
                setBilling(value)
              }}
            />
            <span>
              {value === 'month' ? copy.monthly : copy.yearly}
              {/* A space, so the option is read "Yearly −20%", not "Yearly−20%". */}
              {value === 'year' ? (
                <>
                  {' '}
                  <span className="badge badge--success">{copy.yearlySave}</span>
                </>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
      <ul className="plans" id="plans">
        {planIds.map((plan) => (
          <PlanCard key={plan} plan={plan} interval={interval} copy={copy} config={config} />
        ))}
      </ul>
    </div>
  )
}

interface PlanCardProps {
  readonly plan: PlanId
  readonly interval: Interval
  readonly copy: Messages['pricing']
  readonly config: SiteConfig
}

function PlanCard({ plan, interval, copy, config }: PlanCardProps): React.JSX.Element {
  const details = copy.plans[plan]
  const cents = monthlyPriceCents(plan, interval)
  const yearly = yearlyPriceCents(plan)
  const popular = plan === 'team'
  const href = isSelfServe(plan)
    ? signupUrl(config, { plan, interval })
    : `mailto:${config.contactEmail}?subject=${encodeURIComponent('Ostrom Enterprise')}`
  return (
    <li className={popular ? 'plan plan--popular' : 'plan'}>
      <div className="plan__head">
        <h2 id={`plan-${plan}`} className="plan__name">
          {details.name}
        </h2>
        {popular ? <span className="badge badge--signal">{copy.popular}</span> : null}
      </div>
      <p className="plan__tagline muted">{details.tagline}</p>
      <p className="plan__price" data-testid={`price-${plan}`}>
        {cents === null ? (
          <span className="plan__amount">{copy.custom}</span>
        ) : (
          <>
            <span className="plan__amount">{formatUsd(cents)}</span>
            <span className="plan__unit muted small">{cents === 0 ? copy.free : copy.perPerson}</span>
          </>
        )}
      </p>
      <p className="plan__billing small muted">
        {interval === 'year' && yearly !== null && yearly > 0
          ? format(copy.billedYearly, { amount: formatUsd(yearly) })
          : ' '}
      </p>
      <a className={popular ? 'button button--signal button--block' : 'button button--block'} href={href}>
        {details.cta}
      </a>
      <ul className="plan__features">
        {details.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </li>
  )
}
