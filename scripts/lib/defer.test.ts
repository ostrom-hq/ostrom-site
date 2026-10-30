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

interface Run {
  readonly added: Added[]
  readonly listeners: Listener[]
  readonly idle: (() => void)[]
  readonly timers: (() => void)[]
}

/** Runs the loader against a fake document and window, and returns what it did. */
function run(readyState: string, withIdle: boolean): Run {
  const added: Added[] = []
  const listeners: Listener[] = []
  const idle: (() => void)[] = []
  const timers: (() => void)[] = []
  const body = { appendChild: (element: Added) => added.push(element) }
  const document = { readyState, body, createElement: () => ({ src: '', async: true }) }
  const window = {
    addEventListener: (type: string, listener: () => void) => listeners.push({ type, run: listener }),
    ...(withIdle ? { requestIdleCallback: (callback: () => void) => idle.push(callback) } : {}),
  }
  runInNewContext(loader(['/_next/a.js', '/_next/b.js']), {
    document,
    window,
    setTimeout: (callback: () => void) => timers.push(callback),
  })
  return { added, listeners, idle, timers }
}

describe('loader', () => {
  it('waits for the load event, then for an idle moment, then adds the scripts in order', () => {
    const { added, listeners, idle } = run('loading', true)
    expect(added).toHaveLength(0)
    listeners.find((listener) => listener.type === 'load')?.run()
    expect(added).toHaveLength(0)
    idle[0]?.()
    expect(added).toEqual([
      { src: '/_next/a.js', async: false },
      { src: '/_next/b.js', async: false },
    ])
  })

  it('starts at the first interaction, once', () => {
    const { added, listeners, idle } = run('complete', true)
    expect(listeners.map((listener) => listener.type)).toEqual([
      'pointerdown',
      'keydown',
      'touchstart',
      'focusin',
    ])
    listeners[0]?.run()
    listeners[1]?.run()
    idle[0]?.()
    expect(added).toHaveLength(2)
  })

  it('falls back to a timer without requestIdleCallback', () => {
    const { added, timers } = run('complete', false)
    timers[0]?.()
    expect(added).toHaveLength(2)
  })
})
