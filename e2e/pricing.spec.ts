// SPDX-License-Identifier: Apache-2.0
import type { Page } from '@playwright/test'
import { expect, test } from './test'
import { expectAccessible } from './a11y'

const signup = 'https://app.ostrom.run/signup'

/**
 * The Team card's size and its place in the page (not in the viewport, which `check()` may scroll), to check that
 * switching the interval moves nothing (PB-PR6).
 */
async function teamCardBox(page: Page): Promise<readonly number[]> {
  return page.getByTestId('plan-team').evaluate((card) => {
    const box = card.getBoundingClientRect()
    return [box.left + window.scrollX, box.top + window.scrollY, box.width, box.height]
  })
}

test.describe('pricing', () => {
  test('is reachable from the header', async ({ page, isMobile }) => {
    await page.goto('/')
    if (isMobile) await page.getByText('Menu').click()
    await page.getByRole('link', { name: 'Pricing', exact: true }).first().click()
    await expect(page).toHaveURL(/\/pricing\/$/)
    await expect(page).toHaveTitle('Pricing · Ostrom')
  })

  test('says under the plans that the AI is never charged, word for word', async ({ page }) => {
    await page.goto('/pricing/')
    await expect(page.getByText('We never charge for the AI itself.')).toBeVisible()
    await expect(page.getByText('Bring your own models. We never resell model access.')).toBeVisible()
  })

  test('shows yearly prices first, in USD before tax, per active person', async ({ page }) => {
    await page.goto('/pricing/')
    await expect(page.getByRole('group', { name: 'Billing' }).getByText('Billing')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Yearly −20 %' })).toBeChecked()
    await expect(page.getByTestId('price-team-yearly')).toBeVisible()
    await expect(page.getByTestId('price-team-yearly')).toContainText('$28')
    await expect(page.getByTestId('price-business-yearly')).toContainText('$52')
    await expect(page.getByTestId('price-team-monthly')).toBeHidden()
    await expect(page.getByText('billed yearly, $336 per person')).toBeVisible()
    await expect(page.getByText('billed yearly, $624 per person')).toBeVisible()
    await expect(page.getByTestId('plan-team').getByText('USD, excl. tax')).toBeVisible()
    await expect(page.getByTestId('plan-team').getByText('per active person / month')).toBeVisible()
  })

  test('switches to monthly prices and links without moving the card', async ({ page }) => {
    await page.goto('/pricing/')
    const before = await teamCardBox(page)
    await page.getByRole('radio', { name: 'Monthly' }).check()
    await expect(page.getByTestId('price-team-monthly')).toBeVisible()
    await expect(page.getByTestId('price-team-monthly')).toContainText('$35')
    await expect(page.getByTestId('price-business-monthly')).toContainText('$65')
    await expect(page.getByTestId('price-team-yearly')).toBeHidden()
    await expect(page.getByRole('link', { name: 'Start with Team' })).toHaveAttribute(
      'href',
      `${signup}?plan=team&interval=monthly`,
    )
    expect(await teamCardBox(page)).toEqual(before)
  })

  test('a plan button opens the console sign-up for that plan and interval', async ({ page }) => {
    // The console is another deployment (app.ostrom.run): the test stands in for it and checks what it receives.
    await page.route('https://app.ostrom.run/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Sign up</title><h1>Sign up</h1>',
      }),
    )
    await page.goto('/pricing/')
    await page.getByRole('link', { name: 'Start with Team' }).click()
    await expect(page).toHaveURL(`${signup}?plan=team&interval=yearly`)
    await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible()
  })

  test('Free signs up with its plan only, Business with its interval; Enterprise writes to us', async ({
    page,
  }) => {
    await page.goto('/pricing/')
    await expect(page.getByTestId('plan-free').getByRole('link', { name: 'Start free' })).toHaveAttribute(
      'href',
      `${signup}?plan=free`,
    )
    await expect(page.getByRole('link', { name: 'Start with Business' })).toHaveAttribute(
      'href',
      `${signup}?plan=business&interval=yearly`,
    )
    await expect(page.getByRole('link', { name: 'Talk to us' })).toHaveAttribute(
      'href',
      /^mailto:hello@ostrom\.run/,
    )
  })

  test('compares the plans by See, Steer, Prove, Security and admin, Support', async ({ page }) => {
    await page.goto('/pricing/')
    const table = page.getByRole('table')
    for (const group of ['See', 'Steer', 'Prove', 'Security and admin', 'Support']) {
      await expect(table.getByRole('rowheader', { name: group, exact: true })).toBeVisible()
    }
    await expect(table.getByText('Sign in through your identity provider.')).toBeVisible()
  })

  test('meets WCAG 2.2 AA in both themes', async ({ page }) => {
    await page.goto('/pricing/')
    await expectAccessible(page)
  })
})

test.describe('pricing without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('serves yearly prices and both links in the HTML, and switches by CSS alone', async ({ page }) => {
    await page.goto('/pricing/')
    const team = page.getByTestId('plan-team')
    await expect(page.getByRole('radio', { name: 'Yearly −20 %' })).toBeChecked()
    await expect(page.getByTestId('price-team-yearly')).toBeVisible()
    await expect(page.getByTestId('price-team-monthly')).toBeHidden()
    await expect(team.locator(`a[href="${signup}?plan=team&interval=yearly"]`)).toBeVisible()
    await expect(team.locator(`a[href="${signup}?plan=team&interval=monthly"]`)).toBeAttached()
    await expect(team.locator(`a[href="${signup}?plan=team&interval=monthly"]`)).toBeHidden()

    const before = await teamCardBox(page)
    await page.getByRole('radio', { name: 'Monthly' }).check()
    await expect(page.getByTestId('price-team-monthly')).toBeVisible()
    await expect(page.getByTestId('price-team-yearly')).toBeHidden()
    await expect(team.locator(`a[href="${signup}?plan=team&interval=monthly"]`)).toBeVisible()
    expect(await teamCardBox(page)).toEqual(before)
  })
})
