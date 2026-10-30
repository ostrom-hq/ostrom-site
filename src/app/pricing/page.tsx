// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { ComparePlans, PricingFaq } from '@/components/pricing/PricingDetails'
import { PricingTable } from '@/components/pricing/PricingTable'
import { getMessages } from '@/i18n'
import { site } from '@/lib/site'

const { pricing } = getMessages()

export const metadata: Metadata = {
  title: pricing.metaTitle,
  description: pricing.metaDescription,
  alternates: { canonical: '/pricing/' },
  openGraph: { title: pricing.metaTitle, description: pricing.metaDescription, url: '/pricing/' },
}

export default function PricingPage(): React.JSX.Element {
  return (
    <>
      <section className="section pricing-head">
        <div className="container">
          <p className="eyebrow">{pricing.eyebrow}</p>
          <h1>{pricing.title}</h1>
          <p className="lead">{pricing.lead}</p>
          <PricingTable copy={pricing} config={site} />
          <p className="pricing-note">
            <strong>{pricing.noAiCharge}</strong> {pricing.byok}
          </p>
          <p className="small muted">{pricing.allowanceNote}</p>
        </div>
      </section>
      <ComparePlans copy={pricing} />
      <PricingFaq copy={pricing} />
    </>
  )
}
