// SPDX-License-Identifier: Apache-2.0
import { captured } from '@/lib/docs/text'

/** Text from the OpenAPI description, with its `code` spans shown as code. */
export function InlineText({ text }: { readonly text: string }): React.JSX.Element {
  const parts = text.split(/`([^`]+)`/)
  return (
    <>
      {parts.map((part, position) =>
        position % 2 === 1 ? (
          <code key={position}>{part}</code>
        ) : part === '' ? null : (
          <span key={position}>{part}</span>
        ),
      )}
    </>
  )
}

/** The first sentence of an operation summary is its title; the rest reads as its first paragraph. */
export function splitSummary(summary: string): { readonly title: string; readonly rest: string | null } {
  const match = /^(.+?\S)\.\s+(\S[\s\S]*)$/.exec(summary)
  if (match === null) return { title: summary.replace(/\.$/, ''), rest: null }
  return { title: captured(match, 1), rest: captured(match, 2) }
}
