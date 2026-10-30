// SPDX-License-Identifier: Apache-2.0
// Playwright's `test`, with a page whose `goto` returns once React runs the page. The runtime starts after the first
// paint (scripts/lib/defer.ts): a control pressed before it would do nothing, so every spec imports `test` from here.
// With JavaScript disabled (`test.use({ javaScriptEnabled: false })`) the runtime never starts: `goto` does not wait.
import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page, javaScriptEnabled }, provide) => {
    const goto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await goto(url, options)
      if (javaScriptEnabled) {
        await page.locator('html[data-runtime="ready"]').waitFor({ state: 'attached' })
      }
      return response
    }
    await provide(page)
  },
})
