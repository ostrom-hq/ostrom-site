'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface MobileMenuProps {
  readonly label: string
  readonly children: React.ReactNode
}

/** The element of a ref, which an effect can count on: React sets it before effects run. */
export function mounted<T>(ref: RefObject<T | null>): T {
  if (ref.current === null) throw new Error('The element is not mounted')
  return ref.current
}

/**
 * The small-screen menu: a native disclosure (it works before the JavaScript loads), which also closes on Escape,
 * giving the focus back to its button, and when a link inside it is followed.
 */
export function MobileMenu({ label, children }: MobileMenuProps): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const details = mounted(menu)
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !details.open) return
      details.open = false
      details.querySelector('summary')?.focus()
    }
    const onClick = (event: MouseEvent): void => {
      if (event.target instanceof Element && event.target.closest('a') !== null) details.open = false
    }
    details.addEventListener('keydown', onKey)
    details.addEventListener('click', onClick)
    return () => {
      details.removeEventListener('keydown', onKey)
      details.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <details ref={menu} className="site-header__menu">
      <summary className="button button--small">{label}</summary>
      {children}
    </details>
  )
}
