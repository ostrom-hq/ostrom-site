import {
  CONSENT_EVENT,
  CONSENT_KEY,
  CONSENT_MAX_AGE_MS,
  readConsent,
  subscribeConsent,
  writeConsent,
} from './consent'

describe('consent', () => {
  it('is unset until the visitor chooses', () => {
    expect(readConsent(window.localStorage)).toBe('unset')
  })

  it('remembers a yes or a no for 6 months, then asks again', () => {
    const at = new Date('2026-10-30T10:00:00Z')
    writeConsent(window.localStorage, true, at)
    expect(readConsent(window.localStorage, at.getTime())).toBe('granted')
    writeConsent(window.localStorage, false, at)
    expect(readConsent(window.localStorage, at.getTime() + CONSENT_MAX_AGE_MS)).toBe('denied')
    expect(readConsent(window.localStorage, at.getTime() + CONSENT_MAX_AGE_MS + 1)).toBe('unset')
  })

  it('treats a damaged value as no choice', () => {
    window.localStorage.setItem(CONSENT_KEY, '{not json')
    expect(readConsent(window.localStorage)).toBe('unset')
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: 'yes' }))
    expect(readConsent(window.localStorage)).toBe('unset')
  })

  it('tells this tab and the others when the choice changes', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeConsent(onChange)
    writeConsent(window.localStorage, true)
    window.dispatchEvent(new Event('storage'))
    expect(onChange).toHaveBeenCalledTimes(2)
    unsubscribe()
    window.dispatchEvent(new Event(CONSENT_EVENT))
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(readConsent(window.localStorage)).toBe('granted')
  })
})
