// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect } from 'react'

/**
 * Marks the page once React has taken it over (`<html data-runtime="ready">`). The runtime starts after the first
 * paint (scripts/lib/defer.ts): until then the page is complete but its controls are plain HTML. End-to-end tests wait
 * for this mark before they press a control.
 */
export function RuntimeReady(): null {
  useEffect(() => {
    document.documentElement.dataset['runtime'] = 'ready'
  }, [])
  return null
}
