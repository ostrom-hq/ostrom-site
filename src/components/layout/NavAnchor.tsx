import Link from 'next/link'
import type { NavLink } from '@/lib/navigation'

interface NavAnchorProps {
  readonly link: NavLink
  readonly className?: string
}

/** An internal link goes through next/link (prefetch); an external one is a plain anchor. */
export function NavAnchor({ link, className }: NavAnchorProps): React.JSX.Element {
  if (link.external) {
    return (
      <a className={className} href={link.href} rel={link.href.startsWith('http') ? 'noopener' : undefined}>
        {link.label}
      </a>
    )
  }
  return (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  )
}
