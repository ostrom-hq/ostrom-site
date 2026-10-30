import { render, screen, waitFor } from '@testing-library/react'
import { en } from '@/i18n/en'
import type { Fetcher } from '@/lib/status'
import { StatusBoard } from './StatusBoard'

const config = {
  siteUrl: 'https://ostrom.run',
  appUrl: 'https://app.ostrom.run',
  apiUrl: 'https://api.ostrom.run',
}

describe('StatusBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('checks every component, then shows the result and the time', async () => {
    const fetcher = vi.fn<Fetcher>((url) =>
      Promise.resolve(new Response(null, { status: url.includes('api.') ? 503 : 200 })),
    )
    const { container } = render(<StatusBoard labels={en.status} config={config} fetcher={fetcher} />)
    expect(screen.getAllByText(en.status.checking).length).toBeGreaterThan(0)
    await waitFor(() => {
      expect(screen.getByText(/Last check/)).toBeInTheDocument()
    })
    expect(container.querySelector('[data-health="unreachable"]')).toHaveTextContent(en.status.components.api)
    expect(container.querySelectorAll('[data-health="operational"]')).toHaveLength(2)
  })

  it('uses the browser fetch by default and checks again on its interval', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)
    const { unmount } = render(<StatusBoard labels={en.status} config={config} intervalMs={20} />)
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(6)
    })
    unmount()
  })
})
