import { expect, test } from '@playwright/test'
import { expectAccessible } from './a11y'

const PAGES = [
  { path: '/legal/', title: 'Legal · Ostrom', heading: 'Legal' },
  { path: '/legal/terms/', title: 'Terms of Service · Ostrom', heading: 'Terms of Service' },
  { path: '/legal/privacy/', title: 'Privacy Policy · Ostrom', heading: 'Privacy Policy' },
  { path: '/legal/dpa/', title: 'Data Processing Agreement · Ostrom', heading: 'Data Processing Agreement' },
  { path: '/legal/cookies/', title: 'Cookie Policy · Ostrom', heading: 'Cookie Policy' },
  { path: '/legal/imprint/', title: 'Legal notice · Ostrom', heading: 'Legal notice' },
  { path: '/blog/', title: 'Blog · Ostrom', heading: 'Notes from the people building Ostrom' },
  {
    path: '/blog/launch/',
    title: 'Agents propose. Your team decides. · Ostrom',
    heading: 'Agents propose. Your team decides.',
  },
  { path: '/changelog/', title: 'Changelog · Ostrom', heading: 'What shipped' },
  { path: '/security/', title: 'Security · Ostrom', heading: 'Security is the product.' },
  { path: '/open-source/', title: 'Open source · Ostrom', heading: 'Every line of code is public.' },
  { path: '/compare/', title: 'Compare · Ostrom', heading: 'Where Ostrom fits.' },
  { path: '/status/', title: 'Status · Ostrom', heading: 'System status' },
] as const

test.describe('content pages', () => {
  for (const { path, title, heading } of PAGES) {
    test(`${path} renders and is accessible`, async ({ page }) => {
      // The status page probes the console and the API, other deployments: the test answers for them.
      await page.route(/https:\/\/(app|api)\.ostrom\.run\/.*/, (route) =>
        route.fulfill({ status: 200, body: 'ok' }),
      )
      await page.goto(path)
      await expect(page).toHaveTitle(title)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expectAccessible(page)
    })
  }

  test('drafts say so and stay out of search engines', async ({ page }) => {
    for (const path of ['/legal/terms/', '/blog/launch/']) {
      await page.goto(path)
      await expect(page.getByRole('note')).toContainText('à valider')
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    }
  })

  test('the footer reaches every legal text', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    for (const name of ['Terms', 'Privacy', 'DPA', 'Cookies', 'Legal notice']) {
      await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', /^\/legal\//)
    }
  })

  test('the status page reports each component', async ({ page }) => {
    await page.route(/https:\/\/(app|api)\.ostrom\.run\/.*/, (route) =>
      route.fulfill({ status: 200, body: 'ok' }),
    )
    await page.goto('/status/')
    await expect(page.getByText(/Last check/)).toBeVisible()
    await expect(page.locator('[data-health="operational"]')).toHaveCount(3)
  })

  test('security.txt names the contact', async ({ request }) => {
    const response = await request.get('/.well-known/security.txt')
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain('Contact: mailto:security@ostrom.run')
  })
})
