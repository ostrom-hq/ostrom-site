// A small Markdown subset for the site's own long-form texts (legal pages, blog posts, release notes): headings,
// paragraphs, lists, quotes, rules, fenced code, and inline links, bold, emphasis and code. No raw HTML is ever
// passed through, so a release note cannot inject markup. The docs have their own, fuller pipeline.

export type Inline =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'code'; readonly text: string }
  | { readonly kind: 'strong'; readonly children: readonly Inline[] }
  | { readonly kind: 'em'; readonly children: readonly Inline[] }
  | { readonly kind: 'link'; readonly href: string; readonly children: readonly Inline[] }

export type Block =
  | {
      readonly kind: 'heading'
      readonly level: 2 | 3 | 4
      readonly id: string
      readonly children: readonly Inline[]
    }
  | { readonly kind: 'paragraph'; readonly children: readonly Inline[] }
  | { readonly kind: 'list'; readonly ordered: boolean; readonly items: readonly (readonly Inline[])[] }
  | { readonly kind: 'quote'; readonly children: readonly Inline[] }
  | { readonly kind: 'code'; readonly language: string; readonly text: string }
  | { readonly kind: 'rule' }

const SAFE_HREF = /^(?:https?:\/\/|mailto:|\/|#)/

/** The item at `index`, or '' past the end: one place for the bounds check that strict indexing asks for. */
export function at(items: readonly string[], index: number): string {
  return items[index] ?? ''
}

/** A capture group of a match, or '' when the group did not take part. */
export function group(match: RegExpExecArray, index: number): string {
  return match[index] ?? ''
}

/** A URL-safe id for a heading, like GitHub's: lower case, words joined by dashes. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}

const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])|\[([^\]]+)\]\(([^)\s]+)\)/

/** Parses inline Markdown. An unsafe link target (javascript:, data:) is kept as plain text. */
export function parseInline(source: string): Inline[] {
  const result: Inline[] = []
  let rest = source
  while (rest.length > 0) {
    const match = INLINE.exec(rest)
    if (match === null) {
      result.push({ kind: 'text', text: rest })
      break
    }
    if (match.index > 0) result.push({ kind: 'text', text: rest.slice(0, match.index) })
    const whole = group(match, 0)
    if (match[1] !== undefined) result.push({ kind: 'code', text: match[1] })
    else if (match[2] !== undefined) result.push({ kind: 'strong', children: parseInline(match[2]) })
    else if (match[3] !== undefined) result.push({ kind: 'em', children: parseInline(match[3]) })
    else if (SAFE_HREF.test(group(match, 5)))
      result.push({ kind: 'link', href: group(match, 5), children: parseInline(group(match, 4)) })
    else result.push({ kind: 'text', text: whole })
    rest = rest.slice(match.index + whole.length)
  }
  return result
}

const HEADING = /^(#{2,4})\s+(.*)$/
const BULLET = /^\s*[-*]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

/** Parses a document into blocks. A level-1 heading is ignored: the page title comes from the frontmatter. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  const usedIds = new Map<string, number>()
  let index = 0

  const uniqueId = (text: string): string => {
    const base = slugify(text) || 'section'
    const seen = usedIds.get(base) ?? 0
    usedIds.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${String(seen)}`
  }

  while (index < lines.length) {
    const line = at(lines, index)
    if (line.trim() === '' || /^#\s/.test(line)) {
      index += 1
      continue
    }
    if (line.startsWith('```')) {
      const language = at(line.slice(3).trim().split(/\s+/), 0)
      const body: string[] = []
      index += 1
      while (index < lines.length && !at(lines, index).startsWith('```')) {
        body.push(at(lines, index))
        index += 1
      }
      index += 1
      blocks.push({ kind: 'code', language, text: body.join('\n') })
      continue
    }
    const heading = HEADING.exec(line)
    if (heading !== null) {
      const marks = group(heading, 1).length
      const text = group(heading, 2).trim()
      const level = marks === 2 ? 2 : marks === 3 ? 3 : 4
      blocks.push({ kind: 'heading', level, id: uniqueId(text), children: parseInline(text) })
      index += 1
      continue
    }
    if (/^(?:---|\*\*\*)\s*$/.test(line)) {
      blocks.push({ kind: 'rule' })
      index += 1
      continue
    }
    if (line.startsWith('>')) {
      const quoted: string[] = []
      while (index < lines.length && at(lines, index).startsWith('>')) {
        quoted.push(at(lines, index).replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ kind: 'quote', children: parseInline(quoted.join(' ')) })
      continue
    }
    const listPattern = BULLET.test(line) ? BULLET : NUMBERED.test(line) ? NUMBERED : null
    if (listPattern !== null) {
      const items: Inline[][] = []
      while (index < lines.length) {
        const current = at(lines, index)
        const item = listPattern.exec(current)
        const last = items.at(-1)
        if (item !== null) {
          items.push(parseInline(group(item, 1)))
        } else if (/^\s{2,}\S/.test(current) && last !== undefined) {
          last.push({ kind: 'text', text: ' ' }, ...parseInline(current.trim()))
        } else {
          break
        }
        index += 1
      }
      blocks.push({ kind: 'list', ordered: listPattern === NUMBERED, items })
      continue
    }
    const paragraph: string[] = []
    while (index < lines.length) {
      const current = at(lines, index)
      if (
        current.trim() === '' ||
        HEADING.test(current) ||
        current.startsWith('```') ||
        current.startsWith('>') ||
        BULLET.test(current) ||
        NUMBERED.test(current)
      )
        break
      paragraph.push(current.trim())
      index += 1
    }
    blocks.push({ kind: 'paragraph', children: parseInline(paragraph.join(' ')) })
  }
  return blocks
}

/** The h2 and h3 of a document, for a table of contents. */
export function outline(
  blocks: readonly Block[],
): { readonly id: string; readonly level: 2 | 3; readonly text: string }[] {
  return blocks.flatMap((block) =>
    block.kind === 'heading' && block.level !== 4
      ? [{ id: block.id, level: block.level, text: plainText(block.children) }]
      : [],
  )
}

export function plainText(inlines: readonly Inline[]): string {
  return inlines
    .map((inline) =>
      inline.kind === 'text' || inline.kind === 'code' ? inline.text : plainText(inline.children),
    )
    .join('')
}
