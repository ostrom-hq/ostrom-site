import {
  applyTheme,
  browserStorage,
  parseTheme,
  readTheme,
  THEME_BOOT_SCRIPT,
  THEME_STORAGE_KEY,
  type ThemeStorage,
} from './theme'

const memory = (): ThemeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

const blocked: ThemeStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

describe('theme', () => {
  it('parses only the known themes', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('system')).toBe('system')
    expect(parseTheme('purple')).toBe('system')
    expect(parseTheme(null)).toBe('system')
  })

  it('reads the remembered theme, and falls back to system when storage is blocked', () => {
    const storage = memory()
    storage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(readTheme(storage)).toBe('dark')
    expect(readTheme(blocked)).toBe('system')
  })

  it('sets data-theme and remembers a forced theme', () => {
    const root = document.createElement('html')
    const storage = memory()
    applyTheme(root, storage, 'dark')
    expect(root.dataset['theme']).toBe('dark')
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('clears both for the system theme', () => {
    const root = document.createElement('html')
    const storage = memory()
    applyTheme(root, storage, 'light')
    applyTheme(root, storage, 'system')
    expect(root.dataset['theme']).toBeUndefined()
    expect(storage.values.has(THEME_STORAGE_KEY)).toBe(false)
  })

  it('still switches when storage is blocked', () => {
    const root = document.createElement('html')
    applyTheme(root, blocked, 'light')
    expect(root.dataset['theme']).toBe('light')
    applyTheme(root, blocked, 'system')
    expect(root.dataset['theme']).toBeUndefined()
  })

  it('reaches localStorage at each call, and survives a context where reading it throws', () => {
    applyTheme(document.documentElement, browserStorage, 'dark')
    expect(readTheme(browserStorage)).toBe('dark')
    applyTheme(document.documentElement, browserStorage, 'system')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    expect(readTheme(browserStorage)).toBe('system')
    applyTheme(document.documentElement, browserStorage, 'light')
    expect(document.documentElement.dataset['theme']).toBe('light')
    blocked.mockRestore()
  })

  it('boots the remembered theme before the first paint', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.eval(THEME_BOOT_SCRIPT)
    expect(document.documentElement.dataset['theme']).toBe('dark')
  })
})
