// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/i18n/en'
import { buildSearchIndex, type SearchIndex } from '@/lib/docs/search'
import { fill } from '@/lib/docs/text'
import { MARKDOWN_LABELS, fixtureSite, stubDialog } from '@/test/docs'
import { SearchButton } from './SearchButton'
import SearchDialog, { fetchSearchIndex } from './SearchDialog'

const navigation = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigation.push }) }))

const labels = en.docs.search
const index = buildSearchIndex(fixtureSite(), { markdown: MARKDOWN_LABELS, apiTitle: 'API reference' })

beforeEach(() => {
  stubDialog()
  navigation.push.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function openDialog(
  load: () => Promise<SearchIndex> = () => Promise.resolve(index),
): Promise<{ onClose: ReturnType<typeof vi.fn> }> {
  const onClose = vi.fn()
  render(<SearchDialog labels={labels} version="latest" onClose={onClose} load={load} />)
  await screen.findByText(labels.empty)
  return { onClose }
}

const input = (): HTMLElement => screen.getByRole('combobox', { name: labels.dialog })

describe('SearchDialog', () => {
  it('opens as a modal dialog, loading the index first', async () => {
    let resolve: (value: SearchIndex) => void = () => undefined
    render(
      <SearchDialog
        labels={labels}
        version="latest"
        onClose={vi.fn()}
        load={() =>
          new Promise((done) => {
            resolve = done
          })
        }
      />,
    )
    expect(screen.getByRole('dialog', { name: labels.dialog })).toHaveAttribute('open')
    expect(screen.getByRole('status')).toHaveTextContent(labels.loading)
    await act(async () => {
      resolve(index)
      await Promise.resolve()
    })
    expect(screen.getByRole('status')).toHaveTextContent(labels.empty)
  })

  it('says so when the index cannot be loaded', async () => {
    render(
      <SearchDialog
        labels={labels}
        version="latest"
        onClose={vi.fn()}
        load={() => Promise.reject(new Error('offline'))}
      />,
    )
    expect(await screen.findByText(labels.failed)).toBeInTheDocument()
  })

  it('finds pages and sections as you type, with the page under a section', async () => {
    await openDialog()
    fireEvent.change(input(), { target: { value: 'works today' } })
    const options = screen.getAllByRole('option')
    const section = options.find((option) => option.innerHTML.includes('What works today'))
    expect(section).toHaveTextContent('Introduction')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(/results/)
    expect(input()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.change(input(), { target: { value: 'zzzzqqq' } })
    expect(screen.getByRole('status')).toHaveTextContent(fill(labels.noResults, { query: 'zzzzqqq' }))
    expect(input()).not.toHaveAttribute('aria-activedescendant')
  })

  it('moves through the results with the arrows and opens one with Enter', async () => {
    const { onClose } = await openDialog()
    fireEvent.change(input(), { target: { value: 'gate' } })
    const count = screen.getAllByRole('option').length
    expect(count).toBeGreaterThan(1)
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    const second = screen.getAllByRole('option')[1]
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(input().getAttribute('aria-activedescendant')).toBe(second?.id)
    for (let step = 0; step < count + 2; step += 1) fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[count - 1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input(), { key: 'Tab' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(navigation.push).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('does nothing on Enter without a result, and opens a result by mouse or key', async () => {
    await openDialog()
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(navigation.push).not.toHaveBeenCalled()
    fireEvent.change(input(), { target: { value: 'quickstart' } })
    const [first] = screen.getAllByRole('option')
    if (first === undefined) throw new Error('quickstart should match')
    fireEvent.mouseMove(first)
    fireEvent.keyDown(first, { key: 'Escape' })
    expect(navigation.push).not.toHaveBeenCalled()
    fireEvent.keyDown(first, { key: 'Enter' })
    fireEvent.click(first)
    expect(navigation.push).toHaveBeenCalledTimes(2)
  })

  it('closes with its button, and when it goes away', async () => {
    const { onClose } = await openDialog()
    fireEvent.click(screen.getByRole('button', { name: labels.closeLabel }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })
})

describe('fetchSearchIndex', () => {
  it('reads the index of the build and checks it', async () => {
    const fetch = vi.fn(() => Promise.resolve(Response.json(index)))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchSearchIndex()).resolves.toEqual(index)
    expect(fetch).toHaveBeenCalledWith('/docs/search-index.json')
  })

  it('fails on an HTTP error', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('nope', { status: 404 })))
    await expect(fetchSearchIndex()).rejects.toThrow('HTTP 404')
  })
})

describe('SearchButton', () => {
  it('opens the dialog from the button and closes it again', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json(index)))
    render(<SearchButton labels={labels} version="latest" />)
    const button = screen.getByRole('button', { name: labels.button })
    expect(button).toHaveTextContent('Ctrl K')
    fireEvent.click(button)
    expect(await screen.findByRole('dialog', { name: labels.dialog })).toBeInTheDocument()
    await screen.findByText(labels.empty)
    fireEvent.click(screen.getByRole('button', { name: labels.closeLabel }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens with Cmd+K or Ctrl+K, and not with K alone', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json(index)))
    const { unmount } = render(<SearchButton labels={labels} version="latest" />)
    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'j', metaKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(window, { key: 'K', metaKey: true })
    expect(await screen.findByRole('dialog', { name: labels.dialog })).toBeInTheDocument()
    await screen.findByText(labels.empty)
    fireEvent.click(screen.getByRole('button', { name: labels.closeLabel }))
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(await screen.findByRole('dialog', { name: labels.dialog })).toBeInTheDocument()
    await screen.findByText(labels.empty)
    unmount()
  })

  it('opens with "/" outside a field, and not while typing or with a modifier', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json(index)))
    const { container } = render(
      <div>
        <input aria-label="field" />
        <textarea aria-label="area" />
        <select aria-label="choice" />
        <div contentEditable aria-label="editor">
          <span>inside</span>
        </div>
        <SearchButton labels={labels} version="latest" />
      </div>,
    )
    for (const name of ['field', 'area', 'choice'])
      fireEvent.keyDown(screen.getByLabelText(name), { key: '/' })
    const editor = container.querySelector('[contenteditable]')
    if (!(editor instanceof HTMLElement)) throw new Error('the editor is rendered')
    Object.defineProperty(editor, 'isContentEditable', { value: true })
    fireEvent.keyDown(editor, { key: '/' })
    fireEvent.keyDown(screen.getByText('inside'), { key: '/' })
    fireEvent.keyDown(window, { key: '/', ctrlKey: true })
    fireEvent.keyDown(window, { key: '/', metaKey: true })
    fireEvent.keyDown(window, { key: '/', altKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: labels.button })).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+K Control+K /',
    )
    fireEvent.keyDown(document, { key: '/' })
    expect(await screen.findByRole('dialog', { name: labels.dialog })).toBeInTheDocument()
    await screen.findByText(labels.empty)
    fireEvent.click(screen.getByRole('button', { name: labels.closeLabel }))
    fireEvent.keyDown(document.body, { key: '/' })
    expect(await screen.findByRole('dialog', { name: labels.dialog })).toBeInTheDocument()
    await screen.findByText(labels.empty)
  })
})
