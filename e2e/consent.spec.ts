import { expect, test, type Page } from '@playwright/test'
import { expectAccessible } from './a11y'

/** Gives the page an analytics key, as a container with OSTROM_POSTHOG_API_KEY would, and records what reaches PostHog. */
async function withAnalytics(page: Page): Promise<string[]> {
  const sent: string[] = []
  await page.route('**/site-config.json', (route) =>
    route.fulfill({ json: { posthogKey: 'phc_e2e', posthogHost: 'https://eu.i.posthog.com' } }),
  )
  await page.route(/posthog\.com/, async (route) => {
    sent.push(route.request().url())
    await route.fulfill({ status: 200, json: {} })
  })
  return sent
}

test.describe('cookie consent', () => {
  test('without an analytics key there is no banner and no call to PostHog', async ({ page }) => {
    const sent: string[] = []
    await page.route(/posthog\.com/, async (route) => {
      sent.push(route.request().url())
      await route.abort()
    })
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Cookie choice' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cookie settings' })).toHaveCount(0)
    expect(sent).toEqual([])
  })

  test('asks before measuring; a refusal sends nothing', async ({ page }) => {
    const sent = await withAnalytics(page)
    await page.goto('/')
    const banner = page.getByRole('region', { name: 'Cookie choice' })
    await expect(banner).toBeVisible()
    await expectAccessible(page)
    await banner.getByRole('button', { name: 'Refuse' }).click()
    await expect(banner).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('region', { name: 'Cookie choice' })).toHaveCount(0)
    expect(sent).toEqual([])
  })

  test('a yes starts the measure, and Cookie settings asks again', async ({ page }) => {
    const sent = await withAnalytics(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect.poll(() => sent.length).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Cookie settings' }).click()
    await expect(page.getByRole('region', { name: 'Cookie choice' })).toBeVisible()
  })
})

test('the container serves its run-time settings, without a key by default', async ({ request }) => {
  test.skip(process.env['PLAYWRIGHT_BASE_URL'] === undefined, 'written by the Docker image at start')
  const response = await request.get('/site-config.json')
  expect(response.headers()['cache-control']).toBe('no-store')
  expect(await response.json()).toEqual({ posthogKey: '', posthogHost: 'https://eu.i.posthog.com' })
})
