// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect, useState } from 'react'
import type { Messages } from '@/i18n'

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

  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest('button[data-copy]')
      if (button === null) return
      const text = button.closest('.docs-code')?.querySelector('pre')?.textContent ?? ''
      navigator.clipboard.writeText(text).then(
        () => {
          button.textContent = labels.copied
          setMessage(labels.copied)
          window.setTimeout(() => {
            button.textContent = labels.copy
            setMessage('')
          }, COPIED_FOR_MS)
        },
        () => {
          setMessage(labels.failed)
        },
      )
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [labels])

  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  )
}
