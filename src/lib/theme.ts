export const themes = ['system', 'light', 'dark'] as const
export type Theme = (typeof themes)[number]

export const THEME_STORAGE_KEY = 'ostrom-theme'

export function parseTheme(value: unknown): Theme {
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** Minimal storage surface, so the logic runs against `localStorage` or a test double. */
export interface ThemeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * `localStorage`, reached at each call: in a blocked context (Safari without cookies, a sandboxed frame) even reading
 * `window.localStorage` throws, and the calls above already catch that.
 */
export const browserStorage: ThemeStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => {
    window.localStorage.setItem(key, value)
  },
  removeItem: (key) => {
    window.localStorage.removeItem(key)
  },
}

export function readTheme(storage: ThemeStorage): Theme {
  try {
    return parseTheme(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    // Storage can be blocked (private mode, a strict browser): the system theme is the right answer then.
    return 'system'
  }
}

/** Sets `data-theme` on the root (tokens.css reads it) and remembers the choice. `system` follows the OS. */
export function applyTheme(root: HTMLElement, storage: ThemeStorage, theme: Theme): void {
  if (theme === 'system') {
    delete root.dataset['theme']
  } else {
    root.dataset['theme'] = theme
  }
  try {
    if (theme === 'system') storage.removeItem(THEME_STORAGE_KEY)
    else storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Not remembered when storage is blocked; the page still switches.
  }
}

/** Runs in <head> before the first paint, so a dark-theme visitor never sees a light flash. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})()`
