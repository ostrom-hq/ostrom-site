import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { en } from '@/i18n/en'
import { codeBlockHtml } from '@/lib/docs/code'
import type { NavEntry } from '@/lib/docs/navigation'
import { readDocsSite } from '@/lib/docs/site'
import { MISSING_CONTENT, fixtureSite, linkTarget, stubIntersectionObserver } from '@/test/docs'
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
})

describe('TableOfContents', () => {
  it('lists the sections and marks the one being read', () => {
    const observer = stubIntersectionObserver()
    const heading = document.createElement('h2')
    heading.id = 'one'
    document.body.append(heading)
    const { unmount } = render(
      <TableOfContents
        items={[
          { id: 'one', text: 'One', depth: 2 },
          { id: 'two', text: 'Two', depth: 3 },
        ]}
        label={text.nav.toc}
      />,
    )
    expect(observer.observed).toEqual([heading])
    expect(screen.getByRole('link', { name: 'Two' }).parentElement).toHaveClass('docs-toc__item--nested')
    act(() => {
      observer.trigger([{ isIntersecting: false, target: heading }])
    })
    expect(screen.getByRole('link', { name: 'One' })).not.toHaveAttribute('aria-current')
    act(() => {
      observer.trigger([{ isIntersecting: true, target: heading }])
    })
    expect(screen.getByRole('link', { name: 'One' })).toHaveAttribute('aria-current', 'location')
    unmount()
    expect(observer.disconnect).toHaveBeenCalled()
    heading.remove()
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
