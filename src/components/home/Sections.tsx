// SPDX-License-Identifier: Apache-2.0
import { Converge } from '@/components/brand/Converge'
import type { Messages } from '@/i18n'
import { signupUrl } from '@/lib/navigation'
import type { SiteConfig } from '@/lib/site'
import { ApprovalScene } from './ApprovalScene'

type Home = Messages['home']

interface SectionProps<K extends keyof Home> {
  readonly copy: Home[K]
}

export function Hero({
  copy,
  approval,
  config,
}: SectionProps<'hero'> & {
  readonly approval: Messages['approval']
  readonly config: SiteConfig
}): React.JSX.Element {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="row hero__actions">
            <a className="button button--signal" href={signupUrl(config)}>
              {copy.primary}
            </a>
            <a className="button" href="#how-it-works">
              {copy.secondary}
            </a>
          </div>
          <p className="small muted">{copy.worksWith}</p>
        </div>
        <ApprovalScene labels={approval} />
      </div>
    </section>
  )
}

export function Vision({ copy }: SectionProps<'vision'>): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="vision-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="vision-title" className="measure">
          {copy.title}
        </h2>
        <p className="lead">{copy.body}</p>
        <dl className="stats">
          {copy.stats.map((stat) => (
            <div key={stat.label} className="stats__item">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted">{copy.note}</p>
      </div>
    </section>
  )
}

export function Problem({ copy }: SectionProps<'problem'>): React.JSX.Element {
  return (
    <section className="section" aria-labelledby="problem-title">
      <div className="container grid grid--2">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="problem-title">{copy.title}</h2>
          <p className="lead">{copy.body}</p>
        </div>
        <div className="stack">
          <h3 className="small muted">{copy.researchLabel}</h3>
          {copy.quotes.map((quote) => (
            <figure key={quote.source} className="quote">
              <blockquote>{quote.text}</blockquote>
              <figcaption>
                <a href={quote.href} rel="noopener">
                  {quote.source}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ThirdOption({ copy }: SectionProps<'third'>): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="third-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="third-title">{copy.title}</h2>
        <p className="lead">{copy.body}</p>
        <ul className="options grid grid--3">
          {copy.options.map((option, index) => (
            <li
              key={option.name}
              className={index === copy.options.length - 1 ? 'card options__ours' : 'card'}
            >
              <p className="options__name">{option.name}</p>
              <p className="options__verdict">{option.verdict}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function HowItWorks({ copy }: SectionProps<'how'>): React.JSX.Element {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="how-title">{copy.title}</h2>
        <ol className="steps grid grid--4">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="card steps__item">
              <span className="steps__number mono" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{step.title}</h3>
              <p className="muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Pillars({ copy }: SectionProps<'pillars'>): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="pillars-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="pillars-title">{copy.title}</h2>
        <p className="lead">{copy.body}</p>
        <div className="grid grid--3 pillars">
          {copy.items.map((pillar) => (
            <article key={pillar.name} className="card">
              <p className="pillars__name">{pillar.name}.</p>
              <h3>{pillar.title}</h3>
              <p className="muted">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Receipt({ copy }: SectionProps<'receipt'>): React.JSX.Element {
  return (
    <section className="section" aria-labelledby="receipt-title">
      <div className="container grid grid--2">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="receipt-title">{copy.title}</h2>
          <p className="lead">{copy.body}</p>
        </div>
        <div className="card receipt">
          <span className="badge">{copy.example}</span>
          <dl>
            {copy.rows.map((row) => (
              <div key={row.key} className="receipt__row">
                <dt className="mono small">{row.key}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Approvals({ copy }: SectionProps<'approvals'>): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="approvals-title">
      <div className="container grid grid--2">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="approvals-title">{copy.title}</h2>
          <p className="lead">{copy.body}</p>
        </div>
        <figure className="quote quote--large">
          <blockquote>{copy.quote}</blockquote>
          <figcaption>
            <a href={copy.href} rel="noopener">
              {copy.source}
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export function Motif({ copy }: SectionProps<'motif'>): React.JSX.Element {
  return (
    <section className="section motif" aria-labelledby="motif-title">
      <div className="container">
        <h2 id="motif-title" className="motif__title">
          {copy.title}
        </h2>
        <Converge label={copy.label} agents={copy.agents} gate={copy.gate} shipped={copy.shipped} />
      </div>
    </section>
  )
}

export function OpenSource({ copy }: SectionProps<'open'>): React.JSX.Element {
  return (
    <section className="section section--subtle" aria-labelledby="open-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="open-title">{copy.title}</h2>
        <p className="lead">{copy.money}</p>
        <p className="lead">{copy.byok}</p>
      </div>
    </section>
  )
}

export function Why({ copy }: SectionProps<'why'>): React.JSX.Element {
  return (
    <section className="section" aria-labelledby="why-title">
      <div className="container">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="why-title" className="measure">
          {copy.title}
        </h2>
        <p className="lead">{copy.body}</p>
      </div>
    </section>
  )
}

export function FinalCta({
  copy,
  config,
}: SectionProps<'cta'> & { readonly config: SiteConfig }): React.JSX.Element {
  return (
    <section className="section cta" aria-labelledby="cta-title">
      <div className="container cta__inner">
        <h2 id="cta-title">{copy.title}</h2>
        <div className="row">
          <a className="button button--signal" href={signupUrl(config)}>
            {copy.primary}
          </a>
          <a className="button" href={`mailto:${config.contactEmail}`}>
            {copy.secondary}
          </a>
        </div>
      </div>
    </section>
  )
}
