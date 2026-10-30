// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path'
import { vi } from 'vitest'
import { en } from '@/i18n/en'
import { markdownLabels } from '@/lib/docs/render'
import { readDocsSite, type DocsSite } from '@/lib/docs/site'

/** The fixture content: two versions, nested folders, an OpenAPI description that touches every case. */
export const FIXTURE_CONTENT = join(process.cwd(), 'src', 'test', 'fixtures', 'content')

/** A content folder that does not exist: a checkout before the DOCS content is merged. */
export const MISSING_CONTENT = join(process.cwd(), 'src', 'test', 'fixtures', 'missing')

/** The target of a link, without the trailing slash Next.js drops outside a build with `trailingSlash`. */
export function linkTarget(target: Element | string): string {
  const href = typeof target === 'string' ? target : (target.getAttribute('href') ?? '')
  return href.replace(/\/(?=#|$)/, '')
}

/** The words of the rendered pages, as the site shows them. */
export const MARKDOWN_LABELS = markdownLabels(en.docs)

export const TEST_API_URL = 'https://api.example.test'

export function fixtureSite(): DocsSite {
  return readDocsSite(FIXTURE_CONTENT, TEST_API_URL)
}

export interface ObserverDouble {
  readonly observed: Element[]
  readonly disconnect: ReturnType<typeof vi.fn>
  trigger(entries: readonly { readonly isIntersecting: boolean; readonly target: Element }[]): void
}

/** jsdom has no IntersectionObserver: this double records what is observed and lets a test fire entries. */
export function stubIntersectionObserver(): ObserverDouble {
  const observed: Element[] = []
  const disconnect = vi.fn()
  let callback: (
    entries: readonly { readonly isIntersecting: boolean; readonly target: Element }[],
  ) => void = () => undefined
  class Double {
    constructor(onChange: typeof callback) {
      callback = onChange
    }
    observe(element: Element): void {
      observed.push(element)
    }
    disconnect(): void {
      disconnect()
    }
  }
  vi.stubGlobal('IntersectionObserver', Double)
  return {
    observed,
    disconnect,
    trigger: (entries) => {
      callback(entries)
    },
  }
}

/** jsdom's `<dialog>` has no modal behaviour: open and close it like a browser does, with the close event. */
export function stubDialog(): void {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
