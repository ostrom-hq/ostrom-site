// SPDX-License-Identifier: Apache-2.0
'use client'

import { useId, useSyncExternalStore } from 'react'
import { applyTheme, browserStorage, parseTheme, readTheme, themes, type Theme } from '@/lib/theme'
import type { Messages } from '@/i18n'

const THEME_EVENT = 'ostrom-theme-change'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(THEME_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(THEME_EVENT, onChange)
  }
}

const currentTheme = (): Theme => readTheme(browserStorage)
const serverTheme = (): Theme => 'system'

interface ThemeSelectProps {
  readonly labels: Messages['theme']
}

export function ThemeSelect({ labels }: ThemeSelectProps): React.JSX.Element {
  const id = useId()
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme)

  return (
    <div className="theme-select">
      <label htmlFor={id}>{labels.label}</label>
      <select
        id={id}
        value={theme}
        onChange={(event) => {
          applyTheme(document.documentElement, browserStorage, parseTheme(event.target.value))
          window.dispatchEvent(new Event(THEME_EVENT))
        }}
      >
        {themes.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </div>
  )
}
