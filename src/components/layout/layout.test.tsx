import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { en } from '@/i18n/en'
import { readSiteConfig } from '@/lib/site'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { NavAnchor } from './NavAnchor'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { ThemeSelect } from './ThemeSelect'

const config = readSiteConfig({})

describe('SiteHeader', () => {
  it('links home, the product and the console', () => {
    render(<SiteHeader messages={en} config={config} />)
    expect(screen.getByRole('link', { name: en.a11y.home })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: en.nav.startFree })).toHaveAttribute(
      'href',
      'https://app.ostrom.run/signup',
    )
    const signIns = screen.getAllByRole('link', { name: en.nav.signIn })
    expect(signIns[0]).toHaveAttribute('href', 'https://app.ostrom.run/login')
    expect(screen.getAllByRole('navigation', { name: en.a11y.mainNav })).toHaveLength(2)
  })
})

describe('SiteFooter', () => {
  it('has the motif, the columns and a slot for extra controls', () => {
    render(<SiteFooter messages={en} config={config} extra={<button type="button">extra</button>} />)
    expect(screen.getByText(en.footer.motif)).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: en.a11y.footerNav })
    expect(within(nav).getByRole('heading', { name: en.footer.columns.product })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'extra' })).toBeInTheDocument()
    expect(screen.getByText(en.footer.copyright)).toBeInTheDocument()
  })
})

describe('NavAnchor', () => {
  it('gives external web links noopener, and leaves mail links alone', () => {
    const { rerender } = render(
      <NavAnchor link={{ label: 'GitHub', href: 'https://github.com', external: true }} />,
    )
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('rel', 'noopener')
    rerender(<NavAnchor link={{ label: 'Mail', href: 'mailto:a@b.c', external: true }} />)
    expect(screen.getByRole('link', { name: 'Mail' })).not.toHaveAttribute('rel')
    rerender(<NavAnchor link={{ label: 'Docs', href: '/docs/', external: false }} className="c" />)
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveClass('c')
  })
})

describe('ThemeSelect', () => {
  it('starts on the remembered theme and switches the page', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const user = userEvent.setup()
    render(<ThemeSelect labels={en.theme} />)
    const select = screen.getByRole('combobox', { name: en.theme.label })
    expect(select).toHaveValue('dark')
    await user.selectOptions(select, 'light')
    expect(document.documentElement.dataset['theme']).toBe('light')
    expect(select).toHaveValue('light')
    await user.selectOptions(select, 'system')
    expect(document.documentElement.dataset['theme']).toBeUndefined()
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('follows a change made in another tab', () => {
    render(<ThemeSelect labels={en.theme} />)
    const select = screen.getByRole('combobox', { name: en.theme.label })
    expect(select).toHaveValue('system')
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage'))
    })
    expect(select).toHaveValue('dark')
  })
})
