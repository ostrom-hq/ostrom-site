// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect } from 'react'

export interface ApiDataLabels {
  readonly loading: string
  readonly failed: string
}

type ApiData = Readonly<Record<string, string>>

const requests = new Map<string, Promise<ApiData>>()

function isApiData(value: unknown): value is ApiData {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((html) => typeof html === 'string')
  )
}

async function fetchApiData(url: string): Promise<ApiData> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${String(response.status)}`)
  const data: unknown = await response.json()
  if (!isApiData(data)) throw new Error(`${url} is not a map of HTML`)
  return data
}

/** The data file of a page, fetched once for all its toggles; a failure is forgotten, so the next opening retries. */
export function loadApiData(url: string): Promise<ApiData> {
  const known = requests.get(url)
  if (known !== undefined) return known
  const request = fetchApiData(url)
  requests.set(url, request)
  void request.catch(() => {
    requests.delete(url)
  })
  return request
}

/** Forgets every data file fetched so far (tests). */
export function forgetApiData(): void {
  requests.clear()
}

/** The body of a toggle, added when it first opens: a closed toggle weighs only its summary (page-weight). */
function bodyOf(details: HTMLDetailsElement): HTMLElement {
  const known = details.querySelector<HTMLElement>('[data-api-body]')
  if (known !== null) return known
  const body = document.createElement('div')
  body.className = 'api-more__body'
  body.dataset['apiBody'] = ''
  details.append(body)
  return body
}

/**
 * Fills an opened toggle of the API reference with its HTML: the details of an operation or the fields of a schema,
 * built at build time (lib/openapi/html.ts). Says when it loads, and when it failed (closing and opening retries).
 */
export async function fillApiDetails(details: HTMLDetailsElement, labels: ApiDataLabels): Promise<void> {
  const url = details.dataset['apiData']
  const key = details.dataset['apiKey']
  if (url === undefined || key === undefined) return
  const body = bodyOf(details)
  if (body.dataset['state'] !== undefined) return
  body.dataset['state'] = 'loading'
  body.textContent = labels.loading
  try {
    const data = await loadApiData(url)
    body.innerHTML = data[key] ?? ''
    body.dataset['state'] = 'loaded'
  } catch {
    body.textContent = labels.failed
    delete body.dataset['state']
  }
}

/** Opens the toggle of the operation or schema a link points at (`/docs/api/schemas/#schema-gate`). */
export function openTarget(hash: string): void {
  if (hash.length < 2) return
  const details = document
    .getElementById(hash.slice(1))
    ?.closest('section')
    ?.querySelector<HTMLDetailsElement>('details[data-api-data]')
  if (details !== null && details !== undefined) details.open = true
}

/** One listener for every toggle of an API page, for those opened before it ran, and for the anchor of the page. */
export function ApiDataListener({ labels }: { readonly labels: ApiDataLabels }): null {
  useEffect(() => {
    const onToggle = (event: Event): void => {
      const target = event.target
      if (target instanceof HTMLDetailsElement && target.open && target.dataset['apiData'] !== undefined) {
        void fillApiDetails(target, labels)
      }
    }
    const onHash = (): void => {
      openTarget(window.location.hash)
    }
    // `toggle` does not bubble: listen while it goes down.
    document.addEventListener('toggle', onToggle, true)
    window.addEventListener('hashchange', onHash)
    // A toggle opened before the runtime ran (the page works without it) is filled now.
    for (const details of document.querySelectorAll<HTMLDetailsElement>('details[data-api-data][open]')) {
      void fillApiDetails(details, labels)
    }
    onHash()
    return () => {
      document.removeEventListener('toggle', onToggle, true)
      window.removeEventListener('hashchange', onHash)
    }
  }, [labels])
  return null
}
