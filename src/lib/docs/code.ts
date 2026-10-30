import type { Element, ElementContent } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { highlight } from './highlight'
import { captured } from './text'

export interface CodeBlockOptions {
  /** The language of the fence (`sh`, `json`…); none is plain text. */
  readonly language: string | null | undefined
  /** The rest of the info string: `file="receipt.json"` names the block, `test` and `notest` are for CI only. */
  readonly meta: string | null | undefined
  readonly copyLabel: string
  /** A title that wins over the file name, for generated blocks (`curl`, `Response`). */
  readonly title?: string
}

const FILE = /(?:^|\s)file="([^"]+)"/

const text = (value: string): ElementContent => ({ type: 'text', value })

/** The title shown above a block: its explicit title, else its file name, else its language (never "text"). */
export function codeTitle(language: string, meta: string, title: string | undefined): string | null {
  if (title !== undefined) return title
  const file = FILE.exec(meta)
  if (file !== null) return captured(file, 1)
  return language === 'text' ? null : language
}

/**
 * A code block: a bar with its title and a Copy button, then the coloured `<pre>`. The button is plain HTML; one
 * listener of the page (CopyListener) copies the text of the `<pre>` next to it.
 */
export function codeBlock(code: string, options: CodeBlockOptions): Element {
  const language = options.language ?? 'text'
  const title = codeTitle(language, options.meta ?? '', options.title)
  const bar: ElementContent[] = [
    {
      type: 'element',
      tagName: 'button',
      properties: { type: 'button', className: ['docs-copy'], dataCopy: '' },
      children: [text(options.copyLabel)],
    },
  ]
  if (title !== null) {
    bar.unshift({
      type: 'element',
      tagName: 'span',
      properties: { className: ['docs-code__title'] },
      children: [text(title)],
    })
  }
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['docs-code'], dataLanguage: language },
    children: [
      { type: 'element', tagName: 'div', properties: { className: ['docs-code__bar'] }, children: bar },
      ...highlight(code, language),
    ],
  }
}

/** The same block as HTML, for the generated pages (API reference) that are not written in Markdown. */
export function codeBlockHtml(code: string, options: CodeBlockOptions): string {
  return toHtml(codeBlock(code, options))
}
