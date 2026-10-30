// SPDX-License-Identifier: Apache-2.0
import { runInNewContext } from 'node:vm'
import { deferRuntime, loader } from './defer'

const page = [
  '<html><head><meta charSet="utf-8"/>',
  '<link rel="preload" href="/_next/static/media/a.woff2" as="font" type="font/woff2" crossorigin=""/>',
  '<link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/a.js"/>',
  '<link rel="modulepreload" href="/_next/static/chunks/m.js"/>',
  '<script src="/_next/static/chunks/a.js" async=""></script>',
  '<script src="/_next/static/chunks/p.js" noModule=""></script>',
  '<script>document.documentElement.dataset.theme="dark"</script>',
  '</head><body><h1>Hi</h1>',
  '<script src="/_next/static/chunks/b.js" async=""></script>',
  '<script>(self.__next_f=self.__next_f||[]).push([0])</script>',
  '</body></html>',
].join('')

describe('deferRuntime', () => {
  it('replaces the framework scripts and their preloads by one loader at the end of the body', () => {
    const out = deferRuntime(page)
    expect(out).not.toContain('<script src="/_next/static/chunks/a.js"')
    expect(out).not.toContain('<script src="/_next/static/chunks/b.js"')
    expect(out).not.toContain('as="script"')
    expect(out).not.toContain('modulepreload')
    expect(out).toContain('as="font"')
    expect(out).toContain('document.documentElement.dataset.theme')
    expect(out).toContain('self.__next_f')
    expect(out).toContain('<script src="/_next/static/chunks/p.js" noModule=""></script>')
    expect(out).toMatch(
      /<script>\(function\(\)\{[^<]*"\/_next\/static\/chunks\/a\.js","\/_next\/static\/chunks\/b\.js"\][^<]*<\/script><\/body>/,
    )
  })

  it('leaves a page without framework scripts unchanged', () => {
    const html = '<html><body><p>Plain</p><script src="/other.js"></script></body></html>'
    expect(deferRuntime(html)).toBe(html)
  })

  it('appends the loader to a page without a closing body', () => {
    expect(deferRuntime('<p>x</p><script src="/_next/a.js"></script>')).toMatch(
      /^<p>x<\/p><script>\(function/,
    )
  })
})

interface Listener {
  readonly type: string
  readonly run: () => void
}

interface Added {
  readonly src: string
  readonly async: boolean
}

interface Timer {
  readonly run: () => void
  readonly delay: number
}

/** How the fake window reports the first paint: a largest-paint observer, animation frames, or neither. */
type Paint = 'observer' | 'frames' | 'none'

interface Run {
  readonly root: HTMLElement
  readonly documentListeners: Map<string, (event: Event) => void>
  readonly added: Added[]
  readonly listeners: Listener[]
  readonly idle: (() => void)[]
  readonly timers: Timer[]
  readonly frames: (() => void)[]
  readonly observers: FakeObserver[]
}

interface FakeObserver {
  readonly report: () => void
  readonly options: () => unknown
  readonly disconnected: () => boolean
}

/** Runs the loader against a fake document and window, and returns what it did. */
function run(readyState: string, withIdle: boolean, paint: Paint = 'observer'): Run {
  const added: Added[] = []
  const listeners: Listener[] = []
  const idle: (() => void)[] = []
  const timers: Timer[] = []
  const frames: (() => void)[] = []
  const observers: FakeObserver[] = []
  const body = { appendChild: (element: Added) => added.push(element) }
  const root = window.document.createElement('div')
  const documentListeners = new Map<string, (event: Event) => void>()
  const document = {
    readyState,
    body,
    documentElement: root,
    createElement: () => ({ src: '', async: true }),
    addEventListener: (type: string, listener: (event: Event) => void) =>
      documentListeners.set(type, listener),
  }
  class PerformanceObserver {
    static readonly supportedEntryTypes =
      paint === 'observer' ? ['paint', 'largest-contentful-paint'] : ['paint']
    private observed: unknown = null
    private off = false
    constructor(callback: () => void) {
      observers.push({ report: callback, options: () => this.observed, disconnected: () => this.off })
    }
    observe(options: unknown): void {
      this.observed = options
    }
    disconnect(): void {
      this.off = true
    }
  }
  const fakeWindow = {
    addEventListener: (type: string, listener: () => void) => listeners.push({ type, run: listener }),
    ...(withIdle ? { requestIdleCallback: (callback: () => void) => idle.push(callback) } : {}),
    ...(paint === 'none' ? {} : { PerformanceObserver }),
    ...(paint === 'frames' ? { requestAnimationFrame: (callback: () => void) => frames.push(callback) } : {}),
  }
  runInNewContext(loader(['/_next/a.js', '/_next/b.js']), {
    document,
    window: fakeWindow,
    setTimeout: (callback: () => void, delay: number) => timers.push({ run: callback, delay }),
    MutationObserver: window.MutationObserver,
    Event: window.Event,
    Object,
  })
  return { root, documentListeners, added, listeners, idle, timers, frames, observers }
}

/** Runs the timers set so far whose delay is under the given one, in order. */
function elapse(timers: Timer[], under: number): void {
  for (const timer of timers.splice(0).filter((pending) => pending.delay < under)) timer.run()
}

describe('loader', () => {
  it('waits for the load event, the largest paint and an idle moment, then adds the scripts in order', () => {
    const { added, listeners, idle, observers, timers } = run('loading', true)
    expect(added).toHaveLength(0)
    listeners.find((listener) => listener.type === 'load')?.run()
    expect(observers[0]?.options()).toEqual({ type: 'largest-contentful-paint', buffered: true })
    elapse(timers, 3000)
    expect(idle).toHaveLength(0)
    observers[0]?.report()
    elapse(timers, 3000)
    expect(observers[0]?.disconnected()).toBe(true)
    expect(added).toHaveLength(0)
    idle[0]?.()
    expect(added).toEqual([
      { src: '/_next/a.js', async: false },
      { src: '/_next/b.js', async: false },
    ])
  })

  it('waits for two frames without a largest-paint observer', () => {
    const { idle, frames, timers } = run('complete', true, 'frames')
    elapse(timers, 3000)
    frames.shift()?.()
    expect(idle).toHaveLength(0)
    frames.shift()?.()
    elapse(timers, 3000)
    expect(idle).toHaveLength(1)
  })

  it('goes on after a moment without frames or observer', () => {
    const { idle, timers } = run('complete', true, 'none')
    elapse(timers, 3000)
    expect(idle).toHaveLength(1)
  })

  it('starts the runtime after 3 s when no paint is reported, once', () => {
    const { idle, observers, timers } = run('complete', true)
    const all = [...timers]
    elapse(timers, Infinity)
    expect(all.map((timer) => timer.delay)).toEqual([3000])
    expect(idle).toHaveLength(1)
    observers[0]?.report()
    elapse(timers, Infinity)
    expect(idle).toHaveLength(1)
  })

  it('starts at the first interaction, once', () => {
    const { added, listeners, idle, observers, timers } = run('complete', true)
    expect(listeners.map((listener) => listener.type)).toEqual([
      'pointerdown',
      'keydown',
      'touchstart',
      'focusin',
    ])
    listeners[0]?.run()
    listeners[1]?.run()
    observers[0]?.report()
    elapse(timers, 3000)
    idle[0]?.()
    expect(added).toHaveLength(2)
  })

  it('falls back to a timer without requestIdleCallback', () => {
    const { added, observers, timers } = run('complete', false)
    observers[0]?.report()
    elapse(timers, 3000)
    expect(added).toHaveLength(0)
    elapse(timers, 3000)
    expect(added).toHaveLength(2)
  })

  it('holds a button pressed before the runtime, and presses it again once React runs the page', async () => {
    const { root, documentListeners, added } = run('loading', true)
    const button = window.document.createElement('button')
    const inner = window.document.createElement('span')
    button.append(inner)
    window.document.body.append(button)
    const pressed = vi.fn()
    const early = new MouseEvent('click', { bubbles: true, cancelable: true })
    Object.defineProperty(early, 'target', { value: inner })
    documentListeners.get('click')?.(early)
    expect(early.defaultPrevented).toBe(true)
    expect(added).toHaveLength(2)
    button.addEventListener('click', pressed)
    root.setAttribute('data-runtime', 'ready')
    await Promise.resolve()
    expect(pressed).toHaveBeenCalledTimes(1)
    // Once React runs, a press goes straight through.
    const later = new MouseEvent('click', { bubbles: true, cancelable: true })
    Object.defineProperty(later, 'target', { value: button })
    documentListeners.get('click')?.(later)
    expect(later.defaultPrevented).toBe(false)
    button.remove()
  })

  it('leaves links, disabled buttons and other targets alone', () => {
    const { documentListeners } = run('loading', true)
    const link = window.document.createElement('a')
    const disabled = window.document.createElement('button')
    disabled.disabled = true
    for (const target of [link, disabled, null, {}]) {
      const event = new MouseEvent('click', { cancelable: true })
      Object.defineProperty(event, 'target', { value: target })
      documentListeners.get('click')?.(event)
      expect(event.defaultPrevented).toBe(false)
    }
  })

  it('sets a select changed before the runtime again, and announces it once React runs the page', async () => {
    const { root, documentListeners } = run('loading', true)
    const select = window.document.createElement('select')
    for (const value of ['system', 'dark']) select.append(new Option(value, value))
    window.document.body.append(select)
    select.value = 'dark'
    const early = new Event('change')
    Object.defineProperty(early, 'target', { value: select })
    documentListeners.get('change')?.(early)
    const other = new Event('change')
    Object.defineProperty(other, 'target', { value: window.document.createElement('input') })
    documentListeners.get('change')?.(other)
    select.value = 'system'
    const changed = vi.fn()
    select.addEventListener('change', changed)
    root.setAttribute('data-runtime', 'ready')
    await Promise.resolve()
    expect(select.value).toBe('dark')
    expect(changed).toHaveBeenCalledTimes(1)
    select.remove()
  })

  it('plays nothing when nothing was held, and waits for the ready mark', async () => {
    const { root } = run('loading', true)
    root.setAttribute('data-runtime', 'loading')
    await Promise.resolve()
    root.setAttribute('data-runtime', 'ready')
    await Promise.resolve()
    expect(root.getAttribute('data-runtime')).toBe('ready')
  })
})
