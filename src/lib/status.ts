// SPDX-License-Identifier: Apache-2.0
export type Health = 'checking' | 'operational' | 'unreachable'

export interface Probe {
  readonly id: 'site' | 'console' | 'api'
  readonly url: string
  /** `cors` reads the answer (the API's /health allows ostrom.run); `no-cors` only proves the host answered. */
  readonly mode: 'cors' | 'no-cors'
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export function probes(config: {
  readonly siteUrl: string
  readonly appUrl: string
  readonly apiUrl: string
}): Probe[] {
  return [
    { id: 'site', url: '/healthz', mode: 'cors' },
    { id: 'console', url: `${config.appUrl}/`, mode: 'no-cors' },
    { id: 'api', url: `${config.apiUrl}/health`, mode: 'cors' },
  ]
}

/** One probe: operational when the host answers in time (and with 2xx when the answer is readable). */
export async function check(probe: Probe, fetcher: Fetcher, timeoutMs = 5000): Promise<Health> {
  try {
    const response = await fetcher(probe.url, {
      mode: probe.mode,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    return response.type === 'opaque' || response.ok ? 'operational' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
