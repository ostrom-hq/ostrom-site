import { z } from 'zod'

/** The visitor's choice about analytics. Nothing is measured unless it is `granted`. */
export type Consent = 'granted' | 'denied' | 'unset'

export const CONSENT_KEY = 'ostrom-consent'
/** Fired on the window when the choice changes in this tab (other tabs get the `storage` event). */
export const CONSENT_EVENT = 'ostrom-consent-change'
/** Fired by "Cookie settings" to show the banner again. */
export const CONSENT_OPEN_EVENT = 'ostrom-consent-open'
/** A choice is kept 6 months, then asked again (CNIL). */
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000

const storedChoice = z.object({ analytics: z.boolean(), at: z.iso.datetime() })

function parseStored(raw: string): z.infer<typeof storedChoice> | null {
  try {
    const data: unknown = JSON.parse(raw)
    const result = storedChoice.safeParse(data)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function readConsent(storage: Storage, now: number = Date.now()): Consent {
  const raw = storage.getItem(CONSENT_KEY)
  const choice = raw === null ? null : parseStored(raw)
  if (choice === null || now - Date.parse(choice.at) > CONSENT_MAX_AGE_MS) return 'unset'
  return choice.analytics ? 'granted' : 'denied'
}

export function writeConsent(storage: Storage, analytics: boolean, now: Date = new Date()): void {
  storage.setItem(CONSENT_KEY, JSON.stringify({ analytics, at: now.toISOString() }))
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(CONSENT_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CONSENT_EVENT, onChange)
  }
}
