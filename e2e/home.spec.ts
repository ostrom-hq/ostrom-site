// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test'
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
