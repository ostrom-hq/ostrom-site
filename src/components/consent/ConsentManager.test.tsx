// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PostHog } from 'posthog-js'
import type { Mock } from 'vitest'
import { en } from '@/i18n/en'
import type { AnalyticsConfig, PostHogClient } from '@/lib/analytics'
import { CONSENT_KEY, readConsent, writeConsent } from '@/lib/consent'
import { ConsentManager, CookieSettingsButton } from './ConsentManager'

const navigation = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }))
// The real client is never loaded in tests: the default loader gets this stand-in.
const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}))
vi.mock('posthog-js', () => ({ default: posthog }))

const config: AnalyticsConfig = { key: 'phc_test', host: 'https://eu.i.posthog.com' }
const configured = (): Promise<AnalyticsConfig | null> => Promise.resolve(config)
const unconfigured = (): Promise<AnalyticsConfig | null> => Promise.resolve(null)
const never = (): Promise<AnalyticsConfig | null> => new Promise(() => undefined)

function fakeClient(): PostHogClient & { capture: Mock<PostHog['capture']> } {
  return {
    init: vi.fn<PostHog['init']>(),
    capture: vi.fn<PostHog['capture']>(),
    opt_in_capturing: vi.fn<PostHog['opt_in_capturing']>(),
    opt_out_capturing: vi.fn<PostHog['opt_out_capturing']>(),
  }
}

describe('ConsentManager', () => {
  beforeEach(() => {
    navigation.pathname = '/'
  })

  it('shows nothing and loads nothing without an analytics key', async () => {
    const loadClient = vi.fn(() => Promise.resolve(fakeClient()))
    const { container } = render(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={unconfigured}
        loadClient={loadClient}
      />,
    )
    await act(() => Promise.resolve())
    expect(container).toBeEmptyDOMElement()
    expect(loadClient).not.toHaveBeenCalled()
  })

  it('asks once, with both answers equally visible, and measures after a yes', async () => {
    const user = userEvent.setup()
    const client = fakeClient()
    render(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={configured}
        loadClient={() => Promise.resolve(client)}
      />,
    )
    const region = await screen.findByRole('region', { name: en.consent.title })
    expect(region).toHaveTextContent(en.consent.body)
    expect(screen.getByRole('link', { name: en.consent.policy })).toHaveAttribute('href', '/legal/cookies/')
    const accept = screen.getByRole('button', { name: en.consent.accept })
    const refuse = screen.getByRole('button', { name: en.consent.refuse })
    expect(accept.className).toBe(refuse.className)
    expect(client.capture).not.toHaveBeenCalled()

    await user.click(accept)
    expect(readConsent(window.localStorage)).toBe('granted')
    expect(screen.queryByRole('region')).toBeNull()
    await waitFor(() => {
      expect(client.capture).toHaveBeenCalledWith('consent_updated', { analytics: true })
    })
    expect(client.capture).toHaveBeenCalledWith('$pageview', { $current_url: window.location.href })
  })

  it('remembers an earlier yes without announcing it again, and follows navigation and calls to action', async () => {
    writeConsent(window.localStorage, true)
    const client = fakeClient()
    const { rerender } = render(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={configured}
        loadClient={() => Promise.resolve(client)}
      />,
    )
    await waitFor(() => {
      expect(client.capture).toHaveBeenCalledWith('$pageview', { $current_url: window.location.href })
    })
    expect(client.capture).not.toHaveBeenCalledWith('consent_updated', expect.anything())
    expect(screen.queryByRole('region')).toBeNull()

    client.capture.mockClear()
    rerender(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={configured}
        loadClient={() => Promise.resolve(client)}
      />,
    )
    expect(client.capture).not.toHaveBeenCalled()
    navigation.pathname = '/pricing/'
    rerender(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={configured}
        loadClient={() => Promise.resolve(client)}
      />,
    )
    expect(client.capture).toHaveBeenCalledWith('$pageview', { $current_url: window.location.href })

    document.body.insertAdjacentHTML(
      'beforeend',
      '<a href="/pricing/" id="cta-pricing">Pricing</a><a href="https://app.ostrom.run/signup" id="cta-signup"><span>Start</span></a><a href="/blog/" id="plain">Blog</a>',
    )
    fireEvent.click(document.getElementById('cta-pricing') ?? document.body)
    fireEvent.click(document.querySelector('#cta-signup span') ?? document.body)
    fireEvent.click(document.getElementById('plain') ?? document.body)
    fireEvent.click(document.body)
    document.dispatchEvent(new MouseEvent('click'))
    expect(client.capture).toHaveBeenCalledWith('cta_clicked', { cta: 'pricing' })
    expect(client.capture).toHaveBeenCalledWith('cta_clicked', { cta: 'signup' })
    expect(client.capture.mock.calls.filter(([event]) => event === 'cta_clicked')).toHaveLength(2)
    document.body.querySelectorAll('#cta-pricing, #cta-signup, #plain').forEach((node) => {
      node.remove()
    })
  })

  it('opens again from Cookie settings, and a no stops and clears the measure', async () => {
    const user = userEvent.setup()
    writeConsent(window.localStorage, true)
    window.localStorage.setItem('ph_phc_test_posthog', '{}')
    const client = fakeClient()
    render(
      <>
        <ConsentManager
          labels={en.consent}
          appUrl="https://app.ostrom.run"
          loadConfig={configured}
          loadClient={() => Promise.resolve(client)}
        />
        <CookieSettingsButton label={en.consent.settings} loadConfig={configured} />
      </>,
    )
    const settings = await screen.findByRole('button', { name: en.consent.settings })
    await user.click(settings)
    const region = await screen.findByRole('region', { name: en.consent.title })
    expect(region).toHaveFocus()
    expect(document.documentElement.dataset['consent']).toBe('open')
    expect(document.documentElement.style.getPropertyValue('--consent-height')).toBe('0px')
    await user.click(screen.getByRole('button', { name: en.consent.refuse }))
    expect(settings).toHaveFocus()
    expect(document.documentElement.dataset['consent']).toBeUndefined()
    expect(window.localStorage.getItem(CONSENT_KEY)).toContain('"analytics":false')
    await waitFor(() => {
      expect(client.opt_out_capturing).toHaveBeenCalled()
    })
    expect(window.localStorage.getItem('ph_phc_test_posthog')).toBeNull()
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('gives the focus to the content after a first choice', async () => {
    const user = userEvent.setup()
    render(
      <>
        <main id="main" tabIndex={-1} />
        <ConsentManager
          labels={en.consent}
          appUrl="https://app.ostrom.run"
          loadConfig={configured}
          loadClient={() => Promise.resolve(fakeClient())}
        />
      </>,
    )
    const region = await screen.findByRole('region', { name: en.consent.title })
    expect(region).not.toHaveFocus()
    await user.click(screen.getByRole('button', { name: en.consent.accept }))
    expect(screen.getByRole('main')).toHaveFocus()
    // Reopened while the focus is on something that cannot take it back (an SVG), the content gets it after.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    document.body.append(svg)
    vi.spyOn(document, 'activeElement', 'get').mockReturnValueOnce(svg)
    act(() => {
      window.dispatchEvent(new Event('ostrom-consent-open'))
    })
    await user.click(await screen.findByRole('button', { name: en.consent.refuse }))
    expect(screen.getByRole('main')).toHaveFocus()
    svg.remove()
  })

  it('works, without remembering, when the browser blocks storage', async () => {
    const user = userEvent.setup()
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    const client = fakeClient()
    render(
      <ConsentManager
        labels={en.consent}
        appUrl="https://app.ostrom.run"
        loadConfig={configured}
        loadClient={() => Promise.resolve(client)}
      />,
    )
    await user.click(await screen.findByRole('button', { name: en.consent.refuse }))
    expect(screen.queryByRole('region')).toBeNull()
    expect(client.opt_out_capturing).not.toHaveBeenCalled()
    blocked.mockRestore()
  })

  it('ignores a configuration that arrives after it is gone, and navigation before it arrives', async () => {
    const { rerender, unmount } = render(
      <ConsentManager labels={en.consent} appUrl="https://app.ostrom.run" loadConfig={never} />,
    )
    navigation.pathname = '/blog/'
    rerender(<ConsentManager labels={en.consent} appUrl="https://app.ostrom.run" loadConfig={never} />)
    unmount()
    let resolve: (value: AnalyticsConfig | null) => void = () => undefined
    const late = new Promise<AnalyticsConfig | null>((done) => {
      resolve = done
    })
    const view = render(
      <ConsentManager labels={en.consent} appUrl="https://app.ostrom.run" loadConfig={() => late} />,
    )
    view.unmount()
    resolve(config)
    await act(() => late)
    expect(screen.queryByRole('region')).toBeNull()
  })
})

describe('defaults', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('read the container configuration once and load posthog-js only after a yes', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ posthogKey: 'phc_live', posthogHost: 'https://eu.i.posthog.com' })),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    writeConsent(window.localStorage, true)
    render(
      <>
        <ConsentManager labels={en.consent} appUrl="https://app.ostrom.run" />
        <CookieSettingsButton label={en.consent.settings} />
      </>,
    )
    await waitFor(() => {
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_live',
        expect.objectContaining({ api_host: 'https://eu.i.posthog.com' }),
      )
    })
    expect(await screen.findByRole('button', { name: en.consent.settings })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/site-config.json', { cache: 'no-store' })
  })
})

describe('CookieSettingsButton', () => {
  it('is hidden without analytics, and ignores a late answer after unmount', async () => {
    const { container } = render(
      <CookieSettingsButton label={en.consent.settings} loadConfig={unconfigured} />,
    )
    await act(() => Promise.resolve())
    expect(container).toBeEmptyDOMElement()
    let resolve: (value: AnalyticsConfig | null) => void = () => undefined
    const late = new Promise<AnalyticsConfig | null>((done) => {
      resolve = done
    })
    const view = render(<CookieSettingsButton label={en.consent.settings} loadConfig={() => late} />)
    view.unmount()
    resolve(config)
    await act(() => late)
  })
})
