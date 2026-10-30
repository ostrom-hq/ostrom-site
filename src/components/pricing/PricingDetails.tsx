// SPDX-License-Identifier: Apache-2.0
import type { Messages } from '@/i18n'

interface CompareProps {
  readonly copy: Messages['pricing']
}

const PLAN_COLUMNS = ['free', 'team', 'business', 'enterprise'] as const

function Cell({
  value,
  copy,
}: {
  readonly value: string
  readonly copy: Messages['pricing']
}): React.JSX.Element {
  if (value === 'yes') {
    return (
      <span className="compare__mark compare__mark--yes" role="img" aria-label={copy.compare.yes}>
        ✓
      </span>
    )
  }
  if (value === 'no') {
    return (
      <span className="compare__mark" role="img" aria-label={copy.compare.no}>
        —
      </span>
    )
  }
  return <>{value}</>
}

/** PB-PR3: the plans side by side, grouped by theme, under a header of plan names that stays in view. */
export function ComparePlans({ copy }: CompareProps): React.JSX.Element {
  return (
    <section className="section" aria-labelledby="compare-title">
      <div className="container">
        <h2 id="compare-title">{copy.compare.title}</h2>
        {/* On a narrow screen the table scrolls sideways: the region takes the focus so a keyboard can scroll it. */}
        <div className="table-wrap compare-wrap" role="region" aria-labelledby="compare-title" tabIndex={0}>
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">{copy.compare.feature}</th>
                {PLAN_COLUMNS.map((plan) => (
                  <th key={plan} scope="col">
                    {copy.plans[plan].name}
                  </th>
                ))}
              </tr>
            </thead>
            {copy.compare.groups.map((group) => (
              <tbody key={group.name}>
                <tr className="compare__group">
                  <th scope="rowgroup" colSpan={PLAN_COLUMNS.length + 1}>
                    {group.name}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">
                      <span className="compare__label">{row.label}</span>
                      <span className="compare__detail">{row.detail}</span>
                    </th>
                    {row.values.map((value, index) => (
                      <td key={PLAN_COLUMNS[index]}>
                        <Cell value={value} copy={copy} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </section>
  )
}

export function PricingFaq({ copy }: CompareProps): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="faq-title">
      <div className="container faq">
        <h2 id="faq-title">{copy.faq.title}</h2>
        <div>
          {copy.faq.items.map((item) => (
            <details key={item.question} className="faq__item">
              <summary>{item.question}</summary>
              <p className="muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
