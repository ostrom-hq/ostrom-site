// SPDX-License-Identifier: Apache-2.0
// Website analytics with PostHog, by the rules of ostrom-core/docs/telemetry.md: nothing is loaded, sent or stored before an
// explicit "accept"; no key configured (self-hosted, CI) means no banner and no network call at all. The key comes
// from the container at run time (/site-config.json, written by nginx from OSTROM_POSTHOG_API_KEY and
// OSTROM_POSTHOG_HOST), so the image the tests ran is the image that ships.
import type { PostHog } from 'posthog-js'
import { z } from 'zod'
import type { Consent } from './consent'
import { at } from './markdown'

export interface AnalyticsConfig {
  readonly key: string
  readonly host: string
}

const runtimeConfig = z.object({ posthogKey: z.string(), posthogHost: z.string() })

/** A PostHog project key and an https host, or null (none: the container has no key). */
export function parseRuntimeConfig(data: unknown): AnalyticsConfig | null {
  const result = runtimeConfig.safeParse(data)
  if (!result.success) return null
  const { posthogKey, posthogHost } = result.data
  if (!posthogKey.startsWith('phc_') || !posthogHost.startsWith('https://')) return null
  return { key: posthogKey, host: posthogHost }
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export async function loadRuntimeConfig(fetcher: Fetcher): Promise<AnalyticsConfig | null> {
  try {
    const response = await fetcher('/site-config.json', { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return parseRuntimeConfig(data)
  } catch {
    return null
  }
}

/** Runs `load` once and shares its promise: the banner and the footer button read the same configuration. */
export function once<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    promise ??= load()
    return promise
  }
}

/** The part of the PostHog client the site uses. */
export type PostHogClient = Pick<PostHog, 'init' | 'capture' | 'opt_in_capturing' | 'opt_out_capturing'>

export const POSTHOG_OPTIONS = {
  person_profiles: 'identified_only',
  persistence: 'localStorage+cookie',
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  disable_session_recording: true,
  // No script from PostHog's servers: the page's CSP allows scripts from the site only.
  disable_external_dependency_loading: true,
  opt_out_capturing_by_default: true,
} as const

export type Cta = 'signup' | 'pricing' | 'docs' | 'github'

/** The call to action a followed link stands for, as OBS names them, or null for any other link. */
export function ctaOf(href: string, appUrl: string): Cta | null {
  if (href.startsWith(`${appUrl}/signup`)) return 'signup'
  if (href.startsWith('https://github.com/')) return 'github'
  const path = href.startsWith('/') ? href : null
  if (path?.startsWith('/pricing') === true) return 'pricing'
  if (path?.startsWith('/docs') === true) return 'docs'
  return null
}

/** Removes what PostHog stored in the browser (cookies and local storage named `ph_…`), after a refusal. */
export function clearAnalyticsStorage(document: Document, storage: Storage): void {
  for (const key of Object.keys(storage)) {
    if (key.startsWith('ph_')) storage.removeItem(key)
  }
  for (const cookie of document.cookie.split(';')) {
    const name = at(cookie.split('='), 0).trim()
    if (name.startsWith('ph_')) document.cookie = `${name}=; Max-Age=0; path=/`
  }
}

export interface Analytics {
  /** Follows the visitor's choice: starts PostHog on `granted` (with the current page view), stops it otherwise. */
  update(consent: Consent, url: string, announce: boolean): Promise<void>
  pageview(url: string): void
  cta(cta: Cta): void
}

interface AnalyticsDeps {
  readonly config: AnalyticsConfig
  readonly loadClient: () => Promise<PostHogClient>
  readonly clearStorage: () => void
}

export function createAnalytics({ config, loadClient, clearStorage }: AnalyticsDeps): Analytics {
  /** The started client, kept across a refusal so a later yes does not load it twice. */
  let client: PostHogClient | null = null
  /** The client while the visitor agrees, null otherwise: every capture goes through it. */
  let live: PostHogClient | null = null
  return {
    async update(consent, url, announce) {
      if (consent !== 'granted') {
        live = null
        client?.opt_out_capturing()
        if (consent === 'denied') clearStorage()
        return
      }
      if (client === null) {
        const loaded = await loadClient()
        loaded.init(config.key, { ...POSTHOG_OPTIONS, api_host: config.host })
        client = loaded
      }
      client.opt_in_capturing()
      live = client
      if (announce) live.capture('consent_updated', { analytics: true })
      live.capture('$pageview', { $current_url: url })
    },
    pageview(url) {
      live?.capture('$pageview', { $current_url: url })
    },
    cta(cta) {
      live?.capture('cta_clicked', { cta })
    },
  }
}
