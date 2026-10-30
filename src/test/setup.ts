import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// next/font only works inside the Next.js compiler; tests get the class names it would produce.
vi.mock('next/font/local', () => ({
  default: (options: { variable: string }) => ({ className: 'font', variable: options.variable.slice(2) }),
}))

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  delete document.documentElement.dataset['theme']
})
