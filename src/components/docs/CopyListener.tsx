// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect, useRef, useState } from 'react'
import type { Messages } from '@/i18n'

/** The clipboard of the browser: missing on an insecure origin (plain http) or in an old browser, whatever the types say. */
const clipboardOf = (browser: { readonly clipboard?: Clipboard | undefined }): Clipboard | undefined =>
  browser.clipboard

/** How long a button reads "Copied" before it reads "Copy" again. */
export const COPIED_FOR_MS = 2000

interface CopyListenerProps {
  readonly labels: Messages['docs']['code']
}

/**
 * Makes every Copy button of the page work: one listener for all of them (the buttons are static HTML in the rendered
 * Markdown and in the API reference). It copies the text of the block's `<pre>` and announces the result.
 */
export function CopyListener({ labels }: CopyListenerProps): React.JSX.Element {
  const [message, setMessage] = useState('')
  // One "Copied" at a time: a second copy puts the first button back to Copy and restarts the delay.
  const shown = useRef<{ readonly button: Element; readonly timer: number } | null>(null)

  useEffect(() => {
    const reset = (): void => {
      const current = shown.current
      if (current === null) return
      window.clearTimeout(current.timer)
      current.button.textContent = labels.copy
      shown.current = null
    }
    const onClick = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest('button[data-copy]')
      if (button === null) return
      // No clipboard: say so rather than throw.
      const clipboard = clipboardOf(navigator)
      if (clipboard === undefined) {
        setMessage(labels.failed)
        return
      }
      const text = button.closest('.docs-code')?.querySelector('pre')?.textContent ?? ''
      clipboard.writeText(text).then(
        () => {
          reset()
          button.textContent = labels.copied
          setMessage(labels.copied)
          const timer = window.setTimeout(() => {
            reset()
            setMessage('')
          }, COPIED_FOR_MS)
          shown.current = { button, timer }
        },
        () => {
          setMessage(labels.failed)
        },
      )
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      reset()
    }
  }, [labels])

  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  )
}
