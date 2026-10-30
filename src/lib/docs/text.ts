/** The text of a capture group, or '' when the group took no part in the match. */
export function captured(match: RegExpExecArray, index: number): string {
  return match[index] ?? ''
}

/** One line of text: every run of whitespace becomes one space. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** At most `max` characters, with an ellipsis when something was cut. */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Fills `{name}` placeholders of an interface text; an unknown placeholder stays visible, so a test catches it. */
export function fill(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder: string, key: string) => values[key] ?? placeholder)
}
