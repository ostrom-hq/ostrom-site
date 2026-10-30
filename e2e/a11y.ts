import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** WCAG 2.2 AA, both themes: no violation is allowed. */
export async function expectAccessible(page: Page): Promise<void> {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map((violation) => `${scheme}: ${violation.id} ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`),
    ).toEqual([])
  }
}
