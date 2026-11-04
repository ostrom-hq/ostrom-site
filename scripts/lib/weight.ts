// SPDX-License-Identifier: Apache-2.0
// How heavy a page is for the browser: the elements it parses, styles and hydrates. Lighthouse's total blocking time
// grows with them on a phone; the API reference once had pages of 10,000 and fell under the floor of 95.

/** The elements of a page: every opening tag of its markup (the text of a script or a style is not markup). */
export function elementCount(html: string): number {
  const markup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style>')
  return markup.match(/<[a-z][^\s/>]*/gi)?.length ?? 0
}

export interface PageWeight {
  readonly page: string
  readonly elements: number
}

/** Every page with its element count, the heaviest first. */
export function pageWeights(pages: ReadonlyMap<string, string>): PageWeight[] {
  return [...pages]
    .map(([page, html]) => ({ page, elements: elementCount(html) }))
    .sort((a, b) => b.elements - a.elements || a.page.localeCompare(b.page))
}
