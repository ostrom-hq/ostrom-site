// SPDX-License-Identifier: Apache-2.0
import { format, type Messages } from '@/i18n'
import { signupUrl } from '@/lib/navigation'
import {
  formatUsd,
  intervals,
  isPaidPlan,
  paidPriceCents,
  planIds,
  type Interval,
  type PaidPlanId,
  type PlanId,
} from '@/lib/pricing'
import type { SiteConfig } from '@/lib/site'

interface PricingTableProps {
  readonly copy: Messages['pricing']
  readonly config: SiteConfig
}

/**
 * The four plans with a yearly / monthly switch, without a script (PB-PR6): every card holds both intervals, price
 * and action, and the two radio inputs show one set by CSS (`pricing.css`). Yearly is checked in the HTML, so the first
 * paint, a crawler and a visitor without JavaScript all see it.
 */
export function PricingTable({ copy, config }: PricingTableProps): React.JSX.Element {
  return (
    <div className="pricing">
      <fieldset className="interval">
        <legend className="interval__legend">{copy.intervalLabel}</legend>
        <div className="segmented">
          {intervals.map((value) => (
            <label key={value} className="segmented__option">
              <input
                type="radio"
                id={`interval-${value}`}
                name="interval"
                value={value}
                defaultChecked={value === 'yearly'}
              />
              <span>
                {value === 'yearly' ? copy.yearly : copy.monthly}
                {/* A space, so the option is read "Yearly −20 %", not "Yearly−20 %". */}
                {value === 'yearly' ? (
                  <>
                    {' '}
                    <span className="badge badge--success">{copy.yearlySave}</span>
                  </>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <ul className="plans" id="plans">
        {planIds.map((plan) => (
          <PlanCard key={plan} plan={plan} copy={copy} config={config} />
        ))}
      </ul>
    </div>
  )
}

interface PlanCardProps {
  readonly plan: PlanId
  readonly copy: Messages['pricing']
  readonly config: SiteConfig
}

function PlanCard({ plan, copy, config }: PlanCardProps): React.JSX.Element {
  const details = copy.plans[plan]
  const popular = plan === 'team'
  const buttonClass = popular ? 'button button--inverse button--block' : 'button button--block'
  return (
    <li className={popular ? 'plan plan--popular' : 'plan'} data-testid={`plan-${plan}`}>
      <div className="plan__head">
        <h2 id={`plan-${plan}`} className="plan__name">
          {details.name}
        </h2>
        {popular ? <span className="badge">{copy.popular}</span> : null}
      </div>
      <p className="plan__tagline muted">{details.tagline}</p>
      {/* Team and Business change with the interval; Free and Enterprise show one price and one action. */}
      <div className="plan__pricebox">
        {isPaidPlan(plan) ? (
          intervals.map((interval) => (
            <IntervalPrice key={interval} plan={plan} interval={interval} copy={copy} />
          ))
        ) : (
          <div className="plan__priceset" data-testid={`price-${plan}`}>
            <p className="plan__price">
              {plan === 'free' ? (
                <>
                  <span className="plan__amount">{formatUsd(0)}</span>
                  <span className="plan__unit muted small">{copy.free}</span>
                </>
              ) : (
                <span className="plan__amount">{copy.custom}</span>
              )}
            </p>
          </div>
        )}
        {isPaidPlan(plan) ? <p className="plan__currency small muted">{copy.currency}</p> : null}
      </div>
      <div className="plan__actions">
        {isPaidPlan(plan) ? (
          intervals.map((interval) => (
            <a
              key={interval}
              className={buttonClass}
              data-interval={interval}
              href={signupUrl(config, { plan, interval })}
            >
              {details.cta}
            </a>
          ))
        ) : (
          <a
            className={buttonClass}
            href={
              plan === 'free'
                ? signupUrl(config, { plan })
                : `mailto:${config.contactEmail}?subject=${encodeURIComponent('Ostrom Enterprise')}`
            }
          >
            {details.cta}
          </a>
        )}
      </div>
      <ul className="plan__features">
        {details.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </li>
  )
}

interface IntervalPriceProps {
  readonly plan: PaidPlanId
  readonly interval: Interval
  readonly copy: Messages['pricing']
}

/** One interval's price of a paid plan: the price per person and month, then how it is billed. */
function IntervalPrice({ plan, interval, copy }: IntervalPriceProps): React.JSX.Element {
  const cents = paidPriceCents(plan, interval)
  const yearly = paidPriceCents(plan, 'yearly') * 12
  return (
    <div className="plan__priceset" data-interval={interval} data-testid={`price-${plan}-${interval}`}>
      <p className="plan__price">
        <span className="plan__amount">{formatUsd(cents)}</span>
        <span className="plan__unit muted small">{copy.perPerson}</span>
      </p>
      <p className="plan__billing small muted" data-interval={interval}>
        {interval === 'yearly'
          ? format(copy.billedYearly, { amount: formatUsd(yearly) })
          : copy.billedMonthly}
      </p>
    </div>
  )
}
