// SPDX-License-Identifier: Apache-2.0
// Playwright's `test`, with a page whose `goto` returns once React runs the page. The runtime starts after the first
// paint (scripts/lib/defer.ts): a control pressed before it would do nothing, so every spec imports `test` from here.
import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, provide) => {
    const goto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await goto(url, options)
      await page.locator('html[data-runtime="ready"]').waitFor({ state: 'attached' })
      return response
    }
    await provide(page)
  },
})
