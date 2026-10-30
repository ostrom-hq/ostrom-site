// SPDX-License-Identifier: Apache-2.0
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { en } from '@/i18n/en'
import { codeBlockHtml } from '@/lib/docs/code'
import { renderMarkdown } from '@/lib/docs/markdown'
import type { NavEntry } from '@/lib/docs/navigation'
import { readDocsSite } from '@/lib/docs/site'
import { MARKDOWN_LABELS, MISSING_CONTENT, fixtureSite, linkTarget, stubIntersectionObserver } from '@/test/docs'
import { Breadcrumbs } from './Breadcrumbs'
import { COPIED_FOR_MS, CopyListener } from './CopyListener'
import { DocArticle, Prose } from './DocArticle'
import { DocsHome } from './DocsHome'
import { DocsShell } from './DocsShell'
import { Pager } from './Pager'
import { SidebarTree } from './Sidebar'
import { SidebarFrame } from './SidebarFrame'
import { StatusBadge } from './StatusBadge'
import { TableOfContents } from './TableOfContents'
import { TAB_STORAGE_PREFIX, TabsListener } from './TabsListener'
import { VersionSelect } from './VersionSelect'

const navigation = vi.hoisted(() => ({ pathname: '/docs/', push: vi.fn() }))
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}))

const docs = fixtureSite()
const text = en.docs

describe('StatusBadge', () => {
  it('shows nothing for an available page and names the other states', () => {
    const { container } = render(<StatusBadge status="available" labels={text.status} />)
    expect(container).toBeEmptyDOMElement()
    render(<StatusBadge status="partial" labels={text.status} />)
    render(<StatusBadge status="coming-soon" labels={text.status} />)
    expect(screen.getByText(text.status.partial)).toHaveClass('docs-status--partial')
    expect(screen.getByText(text.status.comingSoon)).toHaveClass('docs-status--coming-soon')
  })
})

describe('Breadcrumbs', () => {
  it('is hidden on the docs home', () => {
    const { container } = render(
      <Breadcrumbs crumbs={[{ title: 'Docs', href: '/docs/' }]} label="Breadcrumb" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('links the way down and marks the current page', () => {
    render(
      <Breadcrumbs
        crumbs={[
          { title: 'Docs', href: '/docs/' },
          { title: 'Guides', href: null },
          { title: 'Deep', href: null },
        ]}
        label="Breadcrumb"
      />,
    )
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(linkTarget(within(trail).getByRole('link', { name: 'Docs' }))).toBe(linkTarget('/docs/'))
    expect(within(trail).getByText('Deep')).toHaveAttribute('aria-current', 'page')
  })
})

describe('Pager', () => {
  const one = { title: 'One', href: '/docs/one/' }

  it('is hidden on a lone page', () => {
    const { container } = render(<Pager pager={{ previous: null, next: null }} labels={text.nav} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('links the previous and the next page', () => {
    const { rerender } = render(<Pager pager={{ previous: one, next: null }} labels={text.nav} />)
    expect(screen.getByRole('link', { name: /Previous\s*One/ })).toHaveAttribute('rel', 'prev')
    rerender(<Pager pager={{ previous: null, next: one }} labels={text.nav} />)
    expect(screen.getByRole('link', { name: /Next\s*One/ })).toHaveAttribute('rel', 'next')
  })
})

describe('DocArticle', () => {
  it('shows the title, the status and the description above the body', () => {
    render(
      <DocArticle title="Title" description="About." status="partial" labels={text.status}>
        <Prose html="<p>Body</p>" />
      </DocArticle>,
    )
    expect(screen.getByRole('heading', { level: 1, name: /Title/ })).toBeInTheDocument()
    expect(screen.getByText('About.')).toHaveClass('lead')
    expect(screen.getByText('Body').parentElement).toHaveClass('docs-prose')
  })

  it('has a home that says the guides are coming', () => {
    render(<DocsHome messages={en} />)
    expect(screen.getByText(text.home.lead)).toBeInTheDocument()
    expect(linkTarget(screen.getByRole('link', { name: text.home.api }))).toBe(linkTarget('/docs/api/'))
  })
})

describe('VersionSelect', () => {
  it('links every version and marks the one being read', () => {
    render(<VersionSelect versions={docs.versions} current={docs.latest} labels={text.versions} />)
    expect(screen.getByRole('link', { name: 'Latest' })).toHaveAttribute('aria-current', 'page')
    expect(linkTarget(screen.getByRole('link', { name: 'v0.1' }))).toBe(linkTarget('/docs/v/v0.1/'))
    expect(screen.getByRole('link', { name: 'v0.1' })).not.toHaveAttribute('aria-current')
  })

  it('closes on Escape and gives the focus back to its button', () => {
    const { container } = render(
      <VersionSelect versions={docs.versions} current={docs.latest} labels={text.versions} />,
    )
    const menu = container.querySelector('details')
    if (menu === null) throw new Error('the menu is a disclosure')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menu.open).toBe(false)
    menu.open = true
    const link = screen.getByRole('link', { name: 'v0.1' })
    link.focus()
    fireEvent.keyDown(link, { key: 'Enter' })
    expect(menu.open).toBe(true)
    fireEvent.keyDown(link, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(menu.querySelector('summary')).toHaveFocus()
    // Open, the focus elsewhere: Escape closes it and leaves the focus where it is.
    menu.open = true
    menu.querySelector('summary')?.blur()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(menu.open).toBe(false)
    expect(document.activeElement).toBe(document.body)
  })
})

describe('SidebarTree', () => {
  const entries: NavEntry[] = [
    { kind: 'link', title: 'Intro', href: '/docs/', status: 'available' },
    {
      kind: 'group',
      title: 'Guides',
      href: '/docs/guides/',
      status: 'partial',
      items: [
        {
          kind: 'group',
          title: 'Advanced',
          href: '/docs/guides/advanced/',
          status: 'available',
          items: [
            { kind: 'link', title: 'Page', href: '/docs/guides/advanced/page/', status: 'coming-soon' },
          ],
        },
        {
          kind: 'group',
          title: 'Closed',
          href: null,
          status: 'available',
          items: [{ kind: 'link', title: 'Other', href: '/docs/guides/closed/other/', status: 'available' }],
        },
      ],
    },
    { kind: 'group', title: 'API reference', href: null, status: 'available', items: [] },
  ]

  it('marks the page, opens the folders down to it and keeps the others closed', () => {
    const { container } = render(
      <SidebarTree entries={entries} href="/docs/guides/advanced/page/" labels={text.status} depth={0} />,
    )
    expect(screen.getByRole('link', { name: /^Page\s*Coming soon$/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const folders = container.querySelectorAll('details')
    expect(folders[0]).toHaveAttribute('open')
    expect(folders[1]).not.toHaveAttribute('open')
    expect(screen.getByRole('link', { name: 'Advanced' }).parentElement).toHaveClass('docs-nav__folder-index')
    expect(screen.getByRole('link', { name: /^Guides\s*Partial$/ })).toHaveClass(
      'docs-nav__heading--link',
    )
    expect(screen.getByText('API reference')).toHaveClass('docs-nav__heading')
    expect(screen.getByRole('link', { name: 'Intro' })).not.toHaveAttribute('aria-current')
  })

  it('shows a separator of meta.json as a section heading over a plain list', () => {
    const { container } = render(
      <SidebarTree
        entries={[
          {
            kind: 'section',
            title: 'Concepts',
            items: [
              { kind: 'link', title: 'Agents', href: '/docs/agents/', status: 'available' },
              {
                kind: 'group',
                title: 'Receipts',
                href: '/docs/receipts/',
                status: 'available',
                items: [{ kind: 'link', title: 'Format', href: '/docs/receipts/format/', status: 'available' }],
              },
            ],
          },
        ]}
        href="/docs/receipts/format/"
        labels={text.status}
        depth={0}
      />,
    )
    const heading = screen.getByText('Concepts')
    expect(heading).toHaveClass('docs-nav__heading')
    expect(heading.parentElement).toHaveClass('docs-nav__section')
    expect(heading.nextElementSibling).toHaveAttribute('class', 'docs-nav__list')
    expect(container.querySelector('details')).toHaveAttribute('open')
    expect(screen.getByRole('link', { name: 'Format' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('SidebarFrame', () => {
  it('opens on a phone for the page it was opened on only', () => {
    navigation.pathname = '/docs/'
    const { rerender } = render(
      <SidebarFrame label="Docs" menuLabel="Docs menu">
        <p>tree</p>
      </SidebarFrame>,
    )
    const toggle = screen.getByRole('button', { name: 'Docs menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle.parentElement).toHaveAttribute('data-open', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    navigation.pathname = '/docs/other/'
    rerender(
      <SidebarFrame label="Docs" menuLabel="Docs menu">
        <p>tree</p>
      </SidebarFrame>,
    )
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('navigation', { name: 'Docs' })).toHaveAttribute('id', 'docs-sidebar-nav')
    // Without a script, the same words are a link to the tree.
    expect(screen.getByRole('link', { name: 'Docs menu' })).toHaveAttribute('href', '#docs-sidebar-nav')
  })
})

describe('CopyListener', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>()

  beforeEach(() => {
    vi.useFakeTimers()
    writeText.mockReset()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function page(): void {
    render(
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html: codeBlockHtml('echo hi', { language: 'sh', meta: null, copyLabel: 'Copy' }),
          }}
        />
        <button type="button" data-copy="">
          Loose
        </button>
        <p>Not a button</p>
        <CopyListener labels={text.code} />
      </div>,
    )
  }

  it('copies the block, says so, then reads Copy again', async () => {
    writeText.mockResolvedValue(undefined)
    page()
    const button = screen.getByRole('button', { name: 'Copy' })
    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('echo hi')
    expect(button).toHaveTextContent(text.code.copied)
    expect(screen.getByRole('status')).toHaveTextContent(text.code.copied)
    act(() => {
      vi.advanceTimersByTime(COPIED_FOR_MS)
    })
    expect(button).toHaveTextContent('Copy')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('announces a failure, copies nothing outside a code block, and ignores other clicks', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    page()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Loose' }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('')
    expect(screen.getByRole('status')).toHaveTextContent(text.code.failed)
    fireEvent.click(screen.getByText('Not a button'))
    fireEvent.click(document)
    expect(writeText).toHaveBeenCalledTimes(1)
  })

  it('says the copy failed when the browser has no clipboard', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    page()
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('status')).toHaveTextContent(text.code.failed)
  })

  it('shows one Copied at a time, with one timer', async () => {
    writeText.mockResolvedValue(undefined)
    render(
      <div>
        {['one', 'two'].map((code) => (
          <div
            key={code}
            dangerouslySetInnerHTML={{ __html: codeBlockHtml(code, { language: 'sh', meta: null, copyLabel: 'Copy' }) }}
          />
        ))}
        <CopyListener labels={text.code} />
      </div>,
    )
    const [first, second] = screen.getAllByRole('button', { name: 'Copy' })
    if (first === undefined || second === undefined) throw new Error('two blocks')
    const click = async (button: HTMLElement): Promise<void> => {
      await act(async () => {
        fireEvent.click(button)
        await Promise.resolve()
        await Promise.resolve()
      })
    }
    await click(first)
    act(() => {
      vi.advanceTimersByTime(COPIED_FOR_MS - 100)
    })
    await click(second)
    expect(first).toHaveTextContent('Copy')
    expect(second).toHaveTextContent(text.code.copied)
    // The first timer is gone: 100 ms later, the second button still reads Copied.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(second).toHaveTextContent(text.code.copied)
    act(() => {
      vi.advanceTimersByTime(COPIED_FOR_MS)
    })
    expect(second).toHaveTextContent('Copy')
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('TabsListener', () => {
  const set = (group: string, tabs: readonly string[]): string =>
    tabs
      .map((tab) => `\`\`\`sh tab="${tab}" group="${group}" notest="x"\n# ${tab}\necho ${tab}\n\`\`\``)
      .join('\n\n')
  const html = renderMarkdown(`${set('os', ['macOS', 'Linux', 'Windows'])}\n\nBetween.\n\n${set('os', ['macOS', 'Linux'])}\n\nAnd.\n\n${set('agent', ['Codex', 'Claude Code'])}`, {
    labels: MARKDOWN_LABELS,
    rewriteHref: (href) => href,
  }).html

  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function page(): ReturnType<typeof render> {
    return render(
      <div>
        <Prose html={html} />
        <TabsListener label={text.tabs.label} />
      </div>,
    )
  }

  it('is a list of labelled panels until it runs, then WAI-ARIA tabs', () => {
    const markup = renderToStaticMarkup(<Prose html={html} />)
    expect(markup).toContain('<p class="docs-tabs__label">Windows</p>')
    expect(markup).not.toContain('role="tab')
    page()
    const lists = screen.getAllByRole('tablist', { name: text.tabs.label })
    expect(lists).toHaveLength(3)
    const [os] = lists
    if (os === undefined) throw new Error('a tab list')
    const tabs = within(os).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['macOS', 'Linux', 'Windows'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')
    const panel = screen.getAllByRole('tabpanel')[0]
    expect(panel).toHaveAccessibleName('macOS')
    expect(panel).toHaveAttribute('tabindex', '0')
    expect(screen.getAllByText('macOS', { selector: '.docs-tabs__label' })[0]).not.toBeVisible()
    expect(screen.getAllByRole('tabpanel', { hidden: true }).filter((item) => item.hidden === true)).toHaveLength(4)
  })

  it('chooses a tab for every set of its group, keeps the choice, and moves with the keys', () => {
    const { unmount } = page()
    const tab = (name: string, position = 0): HTMLElement => {
      const found = screen.getAllByRole('tab', { name })[position]
      if (found === undefined) throw new Error(`no tab ${name}`)
      return found
    }
    fireEvent.click(tab('Linux'))
    expect(tab('Linux')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Linux', 1)).toHaveAttribute('aria-selected', 'true')
    expect(tab('Codex')).toHaveAttribute('aria-selected', 'true')
    expect(window.localStorage.getItem(`${TAB_STORAGE_PREFIX}os`)).toBe('Linux')
    // Windows exists in the first set only: the second keeps Linux.
    fireEvent.keyDown(tab('Linux'), { key: 'ArrowRight' })
    expect(tab('Windows')).toHaveFocus()
    expect(tab('Windows')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Linux', 1)).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tab('Windows'), { key: 'ArrowRight' })
    expect(tab('macOS')).toHaveFocus()
    fireEvent.keyDown(tab('macOS'), { key: 'ArrowLeft' })
    expect(tab('Windows')).toHaveFocus()
    fireEvent.keyDown(tab('Windows'), { key: 'Home' })
    expect(tab('macOS')).toHaveFocus()
    fireEvent.keyDown(tab('macOS'), { key: 'End' })
    expect(tab('Windows')).toHaveFocus()
    fireEvent.keyDown(tab('Windows'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByText('Between.'), { key: 'ArrowRight' })
    fireEvent.click(screen.getByText('Between.'))
    fireEvent.click(document)
    expect(tab('Windows')).toHaveAttribute('aria-selected', 'true')
    unmount()
    // The next page opens on the kept choice.
    page()
    expect(tab('Windows')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Linux', 1)).toHaveAttribute('aria-selected', 'false')
    expect(tab('macOS', 1)).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to the first tab, and ignores what is not a set of its own', () => {
    window.localStorage.setItem(`${TAB_STORAGE_PREFIX}os`, 'Solaris')
    page()
    expect(screen.getAllByRole('tab', { name: 'macOS' })[0]).toHaveAttribute('aria-selected', 'true')
    cleanup()
    render(
      <div>
        <div className="docs-tabs">
          <div className="docs-tabs__panel">unnamed</div>
        </div>
        <div className="docs-tabs" data-tabs="os" />
        <div className="docs-tabs">
          <div>
            <div className="docs-tabs__list">
              <button type="button" role="tab">
                Nested
              </button>
            </div>
          </div>
        </div>
        <div className="docs-tabs__list">
          <button type="button" role="tab">
            Lost
          </button>
        </div>
        <TabsListener label={text.tabs.label} />
      </div>,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('unnamed')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Nested' }), { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('tab', { name: 'Lost' }))
    expect(window.localStorage.getItem(`${TAB_STORAGE_PREFIX}os`)).toBe('Solaris')
  })

  it('still switches when the browser keeps nothing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    page()
    const [, linux] = screen.getAllByRole('tab')
    if (linux === undefined) throw new Error('a second tab')
    fireEvent.click(linux)
    expect(linux).toHaveAttribute('aria-selected', 'true')
  })
})

describe('TableOfContents', () => {
  function heading(id: string, top: number): HTMLElement {
    const element = document.createElement('h2')
    element.id = id
    element.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: top, width: 10, height: 10 })
    document.body.append(element)
    return element
  }

  it('lists the sections and marks the one being read, scrolling down and back up', () => {
    const observer = stubIntersectionObserver()
    const one = heading('one', 500)
    const two = heading('two', 900)
    const { unmount } = render(
      <TableOfContents
        items={[
          { id: 'one', text: 'One', depth: 2 },
          { id: 'two', text: 'Two', depth: 3 },
          { id: 'gone', text: 'Gone', depth: 2 },
        ]}
        label={text.nav.toc}
      />,
    )
    expect(observer.observed).toEqual([one, two])
    expect(screen.getByRole('link', { name: 'Two' }).parentElement).toHaveClass('docs-toc__item--nested')
    const marked = (): string | null =>
      screen.queryByRole('link', { current: 'location' })?.textContent ?? null
    const at = (topOne: number, topTwo: number): void => {
      one.getBoundingClientRect = () => DOMRect.fromRect({ y: topOne })
      two.getBoundingClientRect = () => DOMRect.fromRect({ y: topTwo })
      act(() => {
        observer.trigger([{ isIntersecting: true, target: one }])
      })
    }
    at(500, 900)
    expect(marked()).toBeNull()
    // Both in the top third (768 / 3 = 256): the topmost wins.
    at(10, 200)
    expect(marked()).toBe('One')
    at(-300, 100)
    expect(marked()).toBe('Two')
    // Two scrolled past, nothing in the top third: still Two. Back up, Two goes below: One again.
    at(-900, -400)
    expect(marked()).toBe('Two')
    at(-100, 600)
    expect(marked()).toBe('One')
    unmount()
    expect(observer.disconnect).toHaveBeenCalled()
    one.remove()
    two.remove()
    vi.unstubAllGlobals()
  })

  it('is hidden on a page without sections', () => {
    stubIntersectionObserver()
    const { container } = render(<TableOfContents items={[]} label={text.nav.toc} />)
    expect(container).toBeEmptyDOMElement()
    vi.unstubAllGlobals()
  })
})

describe('DocsShell', () => {
  beforeEach(() => {
    stubIntersectionObserver()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('frames a page: docs bar, sidebar, breadcrumbs, previous and next', () => {
    render(
      <DocsShell messages={en} docs={docs} version={docs.latest} href="/docs/quickstart/" toc={[]}>
        <p>Page</p>
      </DocsShell>,
    )
    expect(screen.getAllByRole('link', { name: text.title })[0]).toHaveClass('docs-bar__title')
    expect(screen.getByRole('button', { name: new RegExp(text.search.button) })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: text.nav.breadcrumb })).toBeInTheDocument()
    expect(linkTarget(screen.getByRole('link', { name: /Next\s*Guides/ }))).toBe(linkTarget('/docs/guides/'))
    expect(screen.queryByText(/You are reading/)).toBeNull()
  })

  it('tells the reader of an archived version where the latest docs are', () => {
    const archived = docs.versions[1] ?? docs.latest
    render(
      <DocsShell messages={en} docs={docs} version={archived} href="/docs/v/v0.1/" toc={[]}>
        <p>Old</p>
      </DocsShell>,
    )
    expect(screen.getByText(/You are reading the docs of v0\.1\./)).toBeInTheDocument()
    expect(linkTarget(screen.getByRole('link', { name: text.versions.latest }))).toBe(linkTarget('/docs/'))
  })

  it('frames the API reference alone when there are no guides yet', () => {
    const empty = readDocsSite(MISSING_CONTENT)
    render(
      <DocsShell messages={en} docs={empty} version={empty.latest} href="/docs/api/" toc={[]}>
        <p>API</p>
      </DocsShell>,
    )
    expect(
      screen.getByRole('link', { name: /^Overview\s*Coming soon$/ }),
    ).toHaveAttribute('aria-current', 'page')
  })
})

describe('server rendering', () => {
  it('renders the shell without a browser, the search shortcut shown as on a Mac', () => {
    const html = renderToStaticMarkup(
      <DocsShell messages={en} docs={docs} version={docs.latest} href="/docs/" toc={[]}>
        <p>Page</p>
      </DocsShell>,
    )
    expect(html).toContain('⌘K')
  })
})
