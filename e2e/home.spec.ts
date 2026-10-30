// SPDX-License-Identifier: Apache-2.0
import { test as plain } from '@playwright/test'
import { expect, test } from './test'
import { expectAccessible } from './a11y'

test.describe('home', () => {
  test('shows the promise and the scene of the yes on the first screen', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Ostrom · Agents propose. Your team decides.')
    const title = page.getByRole('heading', { level: 1, name: 'Agents propose. Your team decides.' })
    await expect(title).toBeInViewport()
    const approve = page.getByRole('button', { name: 'Approve and ship' })
    await expect(approve).toBeVisible()
    if ((page.viewportSize()?.width ?? 0) >= 1024) await expect(approve).toBeInViewport()
  })

  test('opens the diaphragm on a yes, and undoes it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Approve and ship' }).click()
    await expect(page.getByRole('status')).toHaveText('Approved by you · on the receipt')
    await expect(page.locator('.approval .o-iris')).toHaveAttribute('data-state', 'approved')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('button', { name: 'Send back' })).toBeVisible()
  })

  test('leads to sign-up in the console', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Start free' }).first()).toHaveAttribute('href', /\/signup$/)
  })

  test('"See how it works" scrolls to the steps', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'See how it works' }).click()
    await expect(page).toHaveURL(/#how-it-works$/)
    await expect(page.getByRole('heading', { name: 'From your rules to a yes in Slack.' })).toBeInViewport()
  })

  test('meets WCAG 2.2 AA in both themes', async ({ page }) => {
    await page.goto('/')
    await expectAccessible(page)
  })
})

// The runtime starts after the first paint: a press before it is held, then played once React runs the page.
plain('a yes pressed before the runtime runs is not lost', async ({ page }) => {
  let release = (): void => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/_next/static/chunks/**', async (route) => {
    await held
    await route.continue()
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Approve and ship' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-runtime', 'ready')
  release()
  await expect(page.locator('html')).toHaveAttribute('data-runtime', 'ready')
  await expect(page.getByRole('status')).toHaveText('Approved by you · on the receipt')
})

// Lighthouse counts in its simulated mobile LCP every request started before the largest paint: the runtime's
// scripts must start after it, or the landing loses about a second on a slow phone.
test('requests the runtime only after the largest paint', async ({ page }) => {
  await page.goto('/')
  const timings = await page.evaluate(
    () =>
      new Promise<{ largest: number; firstScript: number }>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const largest = entries[entries.length - 1]?.startTime ?? Number.NaN
          const scripts = performance
            .getEntriesByType('resource')
            .filter(
              (entry) => new URL(entry.name).pathname.startsWith('/_next/') && entry.name.endsWith('.js'),
            )
          resolve({ largest, firstScript: Math.min(...scripts.map((entry) => entry.startTime)) })
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      }),
  )
  expect(Number.isFinite(timings.firstScript)).toBe(true)
  expect(timings.firstScript).toBeGreaterThan(timings.largest)
})
