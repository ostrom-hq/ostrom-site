import { expect, test, type Page } from '@playwright/test'

// PUBLIC-BAR PB-C2: garnet is the gesture of a person approving an agent's work. On public pages it appears only
// inside a product scene ([data-scene]) and in the Ostrom mark ([data-mark]); links, actions and the focus ring are ink.
const SIGNAL_TOKENS = ['--signal', '--signal-hover', '--signal-text', '--signal-tint', '--signal-border']
const PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-left-color',
  'outline-color',
  'fill',
  'stroke',
]

async function routes(page: Page): Promise<string[]> {
  const response = await page.request.get('/sitemap.xml')
  const xml = await response.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1] ?? '/').pathname)
}

async function garnetOutsideScenes(
  page: Page,
): Promise<{ readonly hits: string[]; readonly focus: boolean }> {
  return page.evaluate(
    ({ tokens, properties }) => {
      const probe = document.createElement('i')
      document.body.append(probe)
      const root = getComputedStyle(document.documentElement)
      const resolve = (value: string): string => {
        probe.style.color = value
        return getComputedStyle(probe).color
      }
      const garnet = new Set(tokens.map((token) => resolve(root.getPropertyValue(token).trim())))
      const focus = garnet.has(resolve(root.getPropertyValue('--focus').trim()))
      probe.remove()
      const hits: string[] = []
      for (const element of document.querySelectorAll('body *')) {
        if (element.closest('[data-scene], [data-mark]') !== null) continue
        const box = element.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) continue
        const style = getComputedStyle(element)
        if (style.visibility === 'hidden') continue
        for (const property of properties) {
          if (garnet.has(style.getPropertyValue(property))) {
            hits.push(`${element.tagName.toLowerCase()}.${element.getAttribute('class') ?? ''} ${property}`)
          }
        }
      }
      return { hits, focus }
    },
    { tokens: SIGNAL_TOKENS, properties: PROPERTIES },
  )
}

for (const scheme of ['light', 'dark'] as const) {
  test(`garnet only for the approval gesture, ${scheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.route(/https:\/\/(app|api)\.ostrom\.run\/.*/, (route) =>
      route.fulfill({ status: 200, body: 'ok' }),
    )
    for (const path of await routes(page)) {
      await page.goto(path)
      const { hits, focus } = await garnetOutsideScenes(page)
      expect(hits, path).toEqual([])
      expect(focus, `${path}: the focus ring`).toBe(false)
    }
  })
}
