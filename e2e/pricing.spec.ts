import { expect, test } from '@playwright/test'
import { expectAccessible } from './a11y'

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

  test('switches between monthly and yearly prices', async ({ page }) => {
    await page.goto('/pricing/')
    await expect(page.getByTestId('price-team')).toContainText('$35')
    await page.locator('label', { hasText: 'Yearly' }).click()
    await expect(page.getByTestId('price-team')).toContainText('$28')
    await expect(page.getByTestId('price-business')).toContainText('$52')
    await expect(page.getByText('billed yearly, $336 per person')).toBeVisible()
  })

  test('a plan button opens the console sign-up for that plan, ready for Stripe Checkout', async ({
    page,
  }) => {
    // The console is another deployment (app.ostrom.run): the test stands in for it and checks what it receives.
    await page.route('https://app.ostrom.run/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Sign up</title><h1>Sign up</h1>',
      }),
    )
    await page.goto('/pricing/')
    await page.locator('label', { hasText: 'Yearly' }).click()
    await page.getByRole('link', { name: 'Start with Team' }).click()
    await expect(page).toHaveURL('https://app.ostrom.run/signup?plan=team&interval=year')
    await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible()
  })

  test('Free and Business sign up with their plan; Enterprise writes to us', async ({ page }) => {
    await page.goto('/pricing/')
    await expect(page.getByRole('link', { name: 'Start free' }).last()).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup?plan=free&interval=month',
    )
    await expect(page.getByRole('link', { name: 'Start with Business' })).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup?plan=business&interval=month',
    )
    await expect(page.getByRole('link', { name: 'Talk to us' })).toHaveAttribute(
      'href',
      /^mailto:hello@ostrom\.run/,
    )
  })

  test('meets WCAG 2.2 AA in both themes', async ({ page }) => {
    await page.goto('/pricing/')
    await expectAccessible(page)
  })
})
