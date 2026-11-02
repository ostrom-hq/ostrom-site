// SPDX-License-Identifier: Apache-2.0
import { render, waitFor } from '@testing-library/react'
import { ApiDataListener, fillApiDetails, forgetApiData, loadApiData, openTarget } from './ApiDataListener'

const labels = { loading: 'Loading…', failed: 'Failed' }

function answer(body: unknown, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) })),
  )
}

/** A section with a heading and a toggle, as the API pages render them. */
function section(id = 'op', src = '/data.json'): HTMLDetailsElement {
  document.body.innerHTML = `<section><h2 id="${id}">Op</h2><details data-api-data="${src}" data-api-key="${id}"><summary>More</summary><div data-api-body=""></div></details></section>`
  const details = document.querySelector('details')
  if (details === null) throw new Error('no toggle')
  return details
}

const bodyOf = (details: HTMLDetailsElement): HTMLElement | null =>
  details.querySelector<HTMLElement>('[data-api-body]')

beforeEach(() => {
  forgetApiData()
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('loadApiData', () => {
  it('fetches a data file once', async () => {
    answer({ a: '<b>A</b>' })
    await expect(loadApiData('/one.json')).resolves.toEqual({ a: '<b>A</b>' })
    await loadApiData('/one.json')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('forgets a failure, so the next call tries again', async () => {
    answer({}, false)
    await expect(loadApiData('/two.json')).rejects.toThrow('/two.json answered 404')
    answer({ a: 'A' })
    await expect(loadApiData('/two.json')).resolves.toEqual({ a: 'A' })
  })

  it('refuses anything but a map of HTML', async () => {
    for (const [file, body] of [
      ['/text.json', 'html'],
      ['/null.json', null],
      ['/list.json', ['a']],
      ['/number.json', { a: 1 }],
    ] as const) {
      answer(body)
      await expect(loadApiData(file)).rejects.toThrow(`${file} is not a map of HTML`)
    }
  })
})

describe('fillApiDetails', () => {
  it('says it loads, then shows the HTML of its key', async () => {
    answer({ op: '<p>Fields</p>' })
    const details = section()
    const filling = fillApiDetails(details, labels)
    expect(bodyOf(details)).toHaveTextContent('Loading…')
    await filling
    expect(bodyOf(details)?.innerHTML).toBe('<p>Fields</p>')
    expect(bodyOf(details)?.dataset['state']).toBe('loaded')
    // Opened again: nothing is fetched or written twice.
    await fillApiDetails(details, labels)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('shows nothing for a key the file does not hold', async () => {
    answer({})
    const details = section()
    await fillApiDetails(details, labels)
    expect(bodyOf(details)).toBeEmptyDOMElement()
  })

  it('says it failed, and tries again at the next opening', async () => {
    answer({}, false)
    const details = section()
    await fillApiDetails(details, labels)
    expect(bodyOf(details)).toHaveTextContent('Failed')
    expect(bodyOf(details)?.dataset['state']).toBeUndefined()
    answer({ op: 'Back' })
    await fillApiDetails(details, labels)
    expect(bodyOf(details)).toHaveTextContent('Back')
  })

  it('leaves a toggle alone without its data, its key or its body', async () => {
    answer({ op: 'A' })
    document.body.innerHTML = '<details><summary>S</summary></details>'
    const bare = document.querySelector('details')
    if (bare === null) throw new Error('no toggle')
    await fillApiDetails(bare, labels)
    bare.dataset['apiData'] = '/data.json'
    await fillApiDetails(bare, labels)
    bare.dataset['apiKey'] = 'op'
    await fillApiDetails(bare, labels)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('openTarget', () => {
  it('opens the toggle of the operation or schema an anchor points at', () => {
    const details = section('schema-gate')
    openTarget('')
    openTarget('#')
    openTarget('#nowhere')
    expect(details.open).toBe(false)
    openTarget('#schema-gate')
    expect(details.open).toBe(true)
  })

  it('does nothing for an anchor outside a section, or a section without toggle', () => {
    document.body.innerHTML = '<h2 id="loose">Loose</h2><section><h2 id="bare">Bare</h2></section>'
    expect(() => {
      openTarget('#loose')
      openTarget('#bare')
    }).not.toThrow()
  })
})

describe('ApiDataListener', () => {
  it('fills a toggle when it opens, and opens the one the address points at', async () => {
    answer({ op: '<p>Loaded</p>' })
    const details = section()
    const { unmount } = render(<ApiDataListener labels={labels} />)
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await waitFor(() => {
      expect(bodyOf(details)).toHaveTextContent('Loaded')
    })
    // A closing, or a toggle that is not the reference's, loads nothing.
    details.open = false
    details.dispatchEvent(new Event('toggle'))
    document.body.insertAdjacentHTML('beforeend', '<details id="other" open></details>')
    document.getElementById('other')?.dispatchEvent(new Event('toggle'))
    document.body.dispatchEvent(new Event('toggle'))
    expect(fetch).toHaveBeenCalledTimes(1)
    window.location.hash = '#op'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(details.open).toBe(true)
    unmount()
    details.open = false
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(details.open).toBe(false)
  })

  it('fills a toggle the reader opened before the runtime ran', async () => {
    answer({ op: '<p>Early</p>' })
    const details = section()
    details.open = true
    render(<ApiDataListener labels={labels} />)
    await waitFor(() => {
      expect(bodyOf(details)).toHaveTextContent('Early')
    })
  })
})
