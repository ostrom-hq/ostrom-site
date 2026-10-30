'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Messages } from '@/i18n'
import {
  clearAnalyticsStorage,
  createAnalytics,
  ctaOf,
  loadRuntimeConfig,
  once,
  type Analytics,
  type AnalyticsConfig,
  type PostHogClient,
} from '@/lib/analytics'
import { CONSENT_OPEN_EVENT, readConsent, subscribeConsent, writeConsent, type Consent } from '@/lib/consent'

interface ConsentManagerProps {
  readonly labels: Messages['consent']
  readonly appUrl: string
  /** Injected for tests; the container's /site-config.json otherwise. */
  readonly loadConfig?: () => Promise<AnalyticsConfig | null>
  /** Injected for tests; posthog-js, loaded only after a yes, otherwise. */
  readonly loadClient?: () => Promise<PostHogClient>
}

const sharedConfig = once(() => loadRuntimeConfig((url, init) => fetch(url, init)))
const defaultLoadClient = async (): Promise<PostHogClient> => (await import('posthog-js')).default

/** Before hydration nothing is known: no banner is rendered on the server, and no page view is announced twice. */
type KnownConsent = Consent | 'pending'
const currentConsent = (): KnownConsent => readConsent(window.localStorage)
const serverConsent = (): KnownConsent => 'pending'

/**
 * The cookie banner and the analytics behind it. Without a PostHog key it renders nothing and loads nothing. With one,
 * it asks once ("Accept" and "Refuse" side by side, equally visible), can be opened again from "Cookie settings", and
 * measures page views and calls to action only after a yes.
 */
export function ConsentManager({
  labels,
  appUrl,
  loadConfig = sharedConfig,
  loadClient = defaultLoadClient,
}: ConsentManagerProps): React.JSX.Element | null {
  const consent = useSyncExternalStore(subscribeConsent, currentConsent, serverConsent)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [reopened, setReopened] = useState(false)
  const previous = useRef<KnownConsent>('pending')
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    void loadConfig().then((config) => {
      if (!cancelled && config !== null) {
        setAnalytics(
          createAnalytics({
            config,
            loadClient,
            clearStorage: () => {
              clearAnalyticsStorage(document, window.localStorage)
            },
          }),
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [loadConfig, loadClient])

  useEffect(() => {
    const open = (): void => {
      setReopened(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, open)
    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT, open)
    }
  }, [])

  // The choice: start or stop. A yes given just now (not one remembered from an earlier visit) is announced.
  useEffect(() => {
    if (analytics === null || consent === 'pending') return
    const announce = consent === 'granted' && previous.current !== 'pending' && previous.current !== 'granted'
    previous.current = consent
    void analytics.update(consent, window.location.href, announce)
  }, [analytics, consent])

  // A page view on each client-side navigation (the first one is sent by update()).
  const firstPath = useRef(pathname)
  useEffect(() => {
    if (pathname === firstPath.current) return
    firstPath.current = pathname
    analytics?.pageview(window.location.href)
  }, [analytics, pathname])

  // Calls to action: any followed link to sign-up, pricing, the docs or GitHub.
  useEffect(() => {
    if (analytics === null) return undefined
    const onClick = (event: MouseEvent): void => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      const cta =
        link === null
          ? null
          : ctaOf(link.href.startsWith(window.location.origin) ? link.pathname : link.href, appUrl)
      if (cta !== null) analytics.cta(cta)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [analytics, appUrl])

  if (analytics === null || (consent !== 'unset' && !reopened)) return null
  const choose = (accepted: boolean): void => {
    setReopened(false)
    writeConsent(window.localStorage, accepted)
  }
  return (
    <section className="consent" aria-label={labels.title}>
      <div className="consent__inner">
        <p className="consent__text">
          {labels.body} <Link href="/legal/cookies/">{labels.policy}</Link>
        </p>
        <div className="consent__actions">
          <button
            type="button"
            className="button button--small"
            onClick={() => {
              choose(false)
            }}
          >
            {labels.refuse}
          </button>
          <button
            type="button"
            className="button button--small"
            onClick={() => {
              choose(true)
            }}
          >
            {labels.accept}
          </button>
        </div>
      </div>
    </section>
  )
}

interface CookieSettingsButtonProps {
  readonly label: string
  /** Injected for tests; the shared container configuration otherwise. */
  readonly loadConfig?: () => Promise<AnalyticsConfig | null>
}

/** "Cookie settings" in the footer, shown only where there is something to set: when analytics are configured. */
export function CookieSettingsButton({
  label,
  loadConfig = sharedConfig,
}: CookieSettingsButtonProps): React.JSX.Element | null {
  const [configured, setConfigured] = useState(false)
  useEffect(() => {
    let cancelled = false
    void loadConfig().then((config) => {
      if (!cancelled) setConfigured(config !== null)
    })
    return () => {
      cancelled = true
    }
  }, [loadConfig])
  if (!configured) return null
  return (
    <button
      type="button"
      className="link-button small"
      onClick={() => {
        window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
      }}
    >
      {label}
    </button>
  )
}
