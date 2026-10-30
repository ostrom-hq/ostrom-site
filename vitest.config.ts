import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/lib/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/test/**', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
})
