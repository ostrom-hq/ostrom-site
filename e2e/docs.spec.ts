// SPDX-License-Identifier: Apache-2.0
import { devices } from '@playwright/test'
import { expect, test } from './test'
import { expectAccessible } from './a11y'

// The docs as they ship: the guides of content/docs and the generated API reference.

test('the docs home is reachable from the header, with its sidebar', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.goto('/docs/')
  } else {
    await page.goto('/')
    await page.getByRole('banner').getByRole('link', { name: 'Docs', exact: true }).click()
    await expect(page).toHaveURL(/\/docs\/$/)
  }
  await expect(page.getByRole('heading', { level: 1, name: /Introduction/ })).toBeVisible()
  if (isMobile) {
    const toggle = page.getByRole('button', { name: 'Docs menu' })
    await expect(page.locator('#docs-sidebar-nav')).toBeHidden()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  }
  const sidebar = page.getByRole('navigation', { name: 'Docs', exact: true })
  await expect(sidebar.getByRole('link', { name: /Introduction/ })).toHaveAttribute('aria-current', 'page')
  await sidebar.getByRole('link', { name: /Quickstart/ }).click()
  await expect(page).toHaveURL(/\/docs\/quickstart\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Quickstart/ })).toBeVisible()
  await expectAccessible(page)
})

test('next and previous follow the sidebar', async ({ page }) => {
  await page.goto('/docs/')
  const pager = page.getByRole('navigation', { name: 'More pages' })
  await pager.getByRole('link', { name: /Next/ }).click()
  await expect(page).toHaveURL(/\/docs\/quickstart\/$/)
  await page
    .getByRole('navigation', { name: 'More pages' })
    .getByRole('link', { name: /Previous/ })
    .click()
  await expect(page).toHaveURL(/\/docs\/$/)
})

test('the table of contents jumps to a section', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the table of contents is shown on wide screens only')
  await page.goto('/docs/receipts/format/')
  const toc = page.getByRole('navigation', { name: 'On this page' })
  await toc.getByRole('link', { name: 'Fields' }).click()
  await expect(page).toHaveURL(/#fields$/)
  await expect(page.locator('#fields')).toBeInViewport()
  await expect(toc.getByRole('link', { name: 'Fields' })).toHaveAttribute('aria-current', 'location')
  await expectAccessible(page)
})

test('a code block copies its text and says so', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium only')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/docs/receipts/format/')
  const block = page.locator('.docs-code').first()
  // Located by its role in the block, not its name: the name changes to Copied.
  const button = block.locator('button[data-copy]')
  await expect(button).toHaveAccessibleName('Copy')
  await button.click()
  await expect(button).toHaveText('Copied')
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1)
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toBe(await block.locator('pre').innerText())
  await expect(button).toHaveText('Copy', { timeout: 5000 })
})

test('the search opens with the keyboard and goes to a result', async ({ page }) => {
  await page.goto('/docs/')
  const dialog = page.getByRole('dialog', { name: 'Search the docs' })
  await page.keyboard.press('ControlOrMeta+k')
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.fill('receipt format')
  await expect(dialog.getByRole('option').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('ArrowUp')
  await expectAccessible(page)
  await input.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/docs\/receipts\//)
})

test('"/" opens the search too, but not while typing in it', async ({ page }) => {
  await page.goto('/docs/')
  const dialog = page.getByRole('dialog', { name: 'Search the docs' })
  await page.keyboard.press('/')
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.press('/')
  await expect(input).toHaveValue('/')
})

test('the sidebar is grouped under the headings of meta.json', async ({ page, isMobile }) => {
  await page.goto('/docs/agents/')
  if (isMobile) await page.getByRole('button', { name: 'Docs menu' }).click()
  const sidebar = page.getByRole('navigation', { name: 'Docs', exact: true })
  for (const heading of ['Get started', 'Concepts', 'Cloud', 'Reference', 'Help'])
    await expect(sidebar.locator('.docs-nav__heading', { hasText: new RegExp(`^${heading}$`) })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).not.toContainText('Concepts')
})

test('without a script, the docs menu still reaches the sidebar on a phone', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(!isMobile, 'the menu folds the sidebar on a phone only')
  // A context of its own: the page fixture waits for the runtime, which never runs here.
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    javaScriptEnabled: false,
    ...(baseURL === undefined ? {} : { baseURL }),
  })
  const page = await context.newPage()
  await page.goto('/docs/')
  const nav = page.locator('#docs-sidebar-nav')
  await expect(nav).toBeHidden()
  await page.getByRole('link', { name: 'Docs menu' }).click()
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: /Quickstart/ }).click()
  await expect(page).toHaveURL(/\/docs\/quickstart\/$/)
  await context.close()
})

test('the search button opens the same dialog, Escape closes it and focus stays inside', async ({ page }) => {
  await page.goto('/docs/')
  await page.getByRole('button', { name: 'Search docs' }).click()
  const dialog = page.getByRole('dialog', { name: 'Search the docs' })
  await expect(dialog.getByRole('combobox')).toBeFocused()
  // A modal <dialog> makes the page behind it inert: Tab stays among the dialog's controls.
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'close the search' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('the API reference says what the server serves', async ({ page }) => {
  await page.goto('/docs/api/')
  await expect(page.getByRole('heading', { level: 1, name: /API reference/ })).toBeVisible()
  await expect(page).toHaveTitle('API reference · Ostrom Docs')
  await expectAccessible(page)
})

test('an API page loads the details of an operation when the reader opens them', async ({ page }) => {
  await page.goto('/docs/api/sessions/')
  const first = page.locator('details[data-api-data]').first()
  await expect(first.locator('[data-api-body]')).toHaveCount(0)
  await first.locator('summary').click()
  await expect(first.getByRole('heading', { level: 3 }).first()).toBeVisible()
  await expectAccessible(page)
})

test('the old one-page API reference points at the API reference', async ({ page }) => {
  await page.goto('/docs/reference/api/')
  await expect(page).toHaveURL(/\/docs\/api\/$/)
})

test('an unknown docs page answers 404', async ({ page }) => {
  const response = await page.goto('/docs/does-not-exist/')
  expect(response?.status()).toBe(404)
})
