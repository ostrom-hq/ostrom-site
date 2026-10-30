import type { Block, Inline } from '@/lib/markdown'

function Inlines({ items }: { readonly items: readonly Inline[] }): React.JSX.Element {
  return (
    <>
      {items.map((inline, index) => {
        switch (inline.kind) {
          case 'text':
            return inline.text
          case 'code':
            return <code key={index}>{inline.text}</code>
          case 'strong':
            return (
              <strong key={index}>
                <Inlines items={inline.children} />
              </strong>
            )
          case 'em':
            return (
              <em key={index}>
                <Inlines items={inline.children} />
              </em>
            )
          case 'link':
            return (
              <a key={index} href={inline.href} rel={inline.href.startsWith('http') ? 'noopener' : undefined}>
                <Inlines items={inline.children} />
              </a>
            )
        }
      })}
    </>
  )
}

const HEADING_TAGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const

function BlockView({ block }: { readonly block: Block }): React.JSX.Element {
  switch (block.kind) {
    case 'heading': {
      const Tag = HEADING_TAGS[block.level]
      return (
        <Tag id={block.id}>
          <Inlines items={block.children} />
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p>
          <Inlines items={block.children} />
        </p>
      )
    case 'list': {
      const items = block.items.map((item, index) => (
        <li key={index}>
          <Inlines items={item} />
        </li>
      ))
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>
    }
    case 'quote':
      return (
        <blockquote>
          <Inlines items={block.children} />
        </blockquote>
      )
    case 'code':
      return (
        <pre data-language={block.language === '' ? undefined : block.language}>
          <code>{block.text}</code>
        </pre>
      )
    case 'rule':
      return <hr />
  }
}

/** Renders parsed Markdown blocks inside the `.prose` typography. */
export function Markdown({ blocks }: { readonly blocks: readonly Block[] }): React.JSX.Element {
  return (
    <div className="prose">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  )
}
