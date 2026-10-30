// SPDX-License-Identifier: Apache-2.0
import type { Element, ElementContent } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { highlight } from './highlight'

export interface CodeBlockOptions {
  /** The language of the fence (`sh`, `json`…); none is plain text. */
  readonly language: string | null | undefined
  /** The rest of the info string: `file="receipt.json"` names the block, `test` and `notest` are for CI only. */
  readonly meta: string | null | undefined
  readonly copyLabel: string
  /** A title that wins over the file name, for generated blocks (`curl`, `Response`). */
  readonly title?: string
  /** The title of an `output` block: the output a `test` block above it should print (PB-DP2). */
  readonly outputLabel?: string
}

/**
 * An attribute of the info string, read as `docs-tools` reads it: `name="value"` (backslash escapes) or a bare
 * `name` (true). Undefined when the block does not carry it.
 */
export function metaAttribute(meta: string, name: string): string | true | undefined {
  for (const match of meta.matchAll(/(?<=^|\s)([a-zA-Z][\w-]*)(?:="((?:[^"\\]|\\.)*)")?(?=\s|$)/g)) {
    if (match[1] !== name) continue
    const value = match[2]
    return value === undefined ? true : value.replace(/\\(.)/g, '$1')
  }
  return undefined
}

const text = (value: string): ElementContent => ({ type: 'text', value })

/**
 * The title shown above a block: its explicit title, else "Output" for an `output` block, else its file name, else
 * its language (never "text").
 */
export function codeTitle(
  language: string,
  meta: string,
  title: string | undefined,
  outputLabel?: string,
): string | null {
  if (title !== undefined) return title
  if (outputLabel !== undefined && metaAttribute(meta, 'output') === true) return outputLabel
  const file = metaAttribute(meta, 'file')
  if (typeof file === 'string' && file !== '') return file
  return language === 'text' ? null : language
}

/**
 * A code block: a bar with its title and a Copy button, then the coloured `<pre>`. The button is plain HTML; one
 * listener of the page (CopyListener) copies the text of the `<pre>` next to it.
 */
export function codeBlock(code: string, options: CodeBlockOptions): Element {
  const language = options.language ?? 'text'
  const title = codeTitle(language, options.meta ?? '', options.title, options.outputLabel)
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
