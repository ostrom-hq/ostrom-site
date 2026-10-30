import {
  Approvals,
  FinalCta,
  Hero,
  HowItWorks,
  Motif,
  OpenSource,
  Pillars,
  Problem,
  Receipt,
  ThirdOption,
  Vision,
  Why,
} from '@/components/home/Sections'
import { getMessages } from '@/i18n'
import { site } from '@/lib/site'

export default function HomePage(): React.JSX.Element {
  const { home, approval } = getMessages()
  return (
    <>
      <Hero copy={home.hero} approval={approval} config={site} />
      <Vision copy={home.vision} />
      <Problem copy={home.problem} />
      <ThirdOption copy={home.third} />
      <HowItWorks copy={home.how} />
      <Pillars copy={home.pillars} />
      <Receipt copy={home.receipt} />
      <Approvals copy={home.approvals} />
      <Motif copy={home.motif} />
      <OpenSource copy={home.open} />
      <Why copy={home.why} />
      <FinalCta copy={home.cta} config={site} />
    </>
  )
}
