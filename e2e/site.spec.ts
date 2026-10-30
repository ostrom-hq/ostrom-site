// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test'
import { expectAccessible } from './a11y'

test('an unknown page answers 404 with a way home', async ({ page }) => {
  const response = await page.goto('/does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not here' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to the home page' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expectAccessible(page)
})

test('the skip link jumps to the content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
})

test('the theme choice is remembered across pages', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
})

test('robots.txt and the sitemap are published', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  const rules = await robots.text()
  // Before Lyes's go (NEXT_PUBLIC_LAUNCHED unset): crawlable, so the noindex is read, and no sitemap announced.
  expect(rules).toContain('Allow: /')
  expect(rules).not.toContain('Sitemap:')
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  expect(await sitemap.text()).toContain('<loc>https://ostrom.run/</loc>')
})

test('the container answers its health probe and sends the security headers', async ({ request }) => {
  test.skip(
    process.env['PLAYWRIGHT_BASE_URL'] === undefined,
    'headers come from nginx, in the Docker image only',
  )
  expect((await request.get('/healthz')).ok()).toBe(true)
  const home = await request.get('/')
  const headers = home.headers()
  expect(headers['strict-transport-security']).toContain('max-age=31536000')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  // The image built without the launch switch tells every crawler to stay away, on every answer.
  expect(headers['x-robots-tag']).toBe('noindex, nofollow')
  expect((await request.get('/og.png')).headers()['x-robots-tag']).toBe('noindex, nofollow')
  const asset = /\/_next\/static\/[^"]+\.js/.exec(await home.text())?.[0]
  expect(asset).toBeDefined()
  const cached = await request.get(asset ?? '/')
  expect(cached.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
})
