// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect } from 'react'

/** Where a reader's choice is kept, per group (`os`, `agent`): it holds across pages and visits (PB-DP3). */
export const TAB_STORAGE_PREFIX = 'ostrom.docs.tab.'

interface TabsListenerProps {
  /** The accessible name of every tab list. */
  readonly label: string
}

function stored(group: string): string | null {
  try {
    return window.localStorage.getItem(`${TAB_STORAGE_PREFIX}${group}`)
  } catch {
    // Storage refused (a private window, a blocked cookie setting): the choice lasts for the page only.
    return null
  }
}

function store(group: string, tab: string): void {
  try {
    window.localStorage.setItem(`${TAB_STORAGE_PREFIX}${group}`, tab)
  } catch {
    // Same as above: nothing to keep the choice in, the page still switches.
  }
}

/** A `data-*` value of an element, '' when it has none. */
const data = (element: HTMLElement, name: string): string => element.dataset[name] ?? ''

const tabsOf = (set: Element): HTMLButtonElement[] => [
  ...set.querySelectorAll<HTMLButtonElement>(':scope > .docs-tabs__list > [role="tab"]'),
]
const panelsOf = (set: Element): HTMLElement[] => [
  ...set.querySelectorAll<HTMLElement>(':scope > .docs-tabs__panel'),
]

/** Shows the panel of `name` in one set, if it has one. Returns whether it did. */
function show(set: Element, name: string): boolean {
  const tabs = tabsOf(set)
  if (!tabs.some((tab) => tab.textContent === name)) return false
  const panels = panelsOf(set)
  tabs.forEach((tab, position) => {
    const selected = tab.textContent === name
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
    panels[position]?.toggleAttribute('hidden', !selected)
  })
  return true
}

/** Chooses a tab: every set of its group on the page follows, and the choice is kept. */
function choose(group: string, name: string): void {
  for (const set of document.querySelectorAll(`.docs-tabs[data-enhanced]`)) {
    if (set instanceof HTMLElement && data(set, 'tabs') === group) show(set, name)
  }
  store(group, name)
}

/**
 * Turns one set of labelled panels (the page as it is without a script) into WAI-ARIA tabs: a tab list built from the
 * panels' labels, each panel named by its tab, the labels hidden.
 */
function enhance(set: HTMLElement, index: number, label: string): void {
  const list = document.createElement('div')
  list.className = 'docs-tabs__list'
  list.setAttribute('role', 'tablist')
  list.setAttribute('aria-label', label)
  const panels = panelsOf(set)
  panels.forEach((panel, position) => {
    const id = `docs-tabs-${String(index)}-${String(position)}`
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.id = `${id}-tab`
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-controls', `${id}-panel`)
    tab.textContent = data(panel, 'tab')
    list.append(tab)
    panel.id = `${id}-panel`
    panel.setAttribute('role', 'tabpanel')
    panel.setAttribute('aria-labelledby', tab.id)
    panel.tabIndex = 0
    panel.querySelector('.docs-tabs__label')?.setAttribute('hidden', '')
  })
  set.prepend(list)
  set.dataset['enhanced'] = 'true'
  const remembered = stored(data(set, 'tabs'))
  const first = panels[0]
  if ((remembered === null || !show(set, remembered)) && first !== undefined) show(set, data(first, 'tab'))
}

const KEYS: Readonly<Record<string, (position: number, count: number) => number>> = {
  ArrowRight: (position, count) => (position + 1) % count,
  ArrowLeft: (position, count) => (position - 1 + count) % count,
  Home: () => 0,
  End: (_position, count) => count - 1,
}

/**
 * Makes the tab sets of the page work once the runtime runs (the panels are static HTML in the rendered Markdown):
 * click or arrow keys choose a tab, Home and End jump to the ends, and the choice applies to every set of its group,
 * on this page and the next ones. Without a script, every panel stays shown under its label.
 */
export function TabsListener({ label }: TabsListenerProps): null {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.docs-tabs:not([data-enhanced])').forEach((set, index) => {
      enhance(set, index, label)
    })
    const tabFrom = (target: EventTarget | null): { tab: HTMLButtonElement; set: HTMLElement } | null => {
      if (!(target instanceof Element)) return null
      const tab = target.closest<HTMLButtonElement>('.docs-tabs__list > [role="tab"]')
      if (tab === null) return null
      const set = tab.closest<HTMLElement>('.docs-tabs')
      return set === null ? null : { tab, set }
    }
    const onClick = (event: MouseEvent): void => {
      const found = tabFrom(event.target)
      if (found !== null) choose(data(found.set, 'tabs'), found.tab.textContent)
    }
    const onKey = (event: KeyboardEvent): void => {
      const found = tabFrom(event.target)
      const move = KEYS[event.key]
      if (found === null || move === undefined) return
      event.preventDefault()
      const tabs = tabsOf(found.set)
      const next = tabs[move(tabs.indexOf(found.tab), tabs.length)]
      if (next === undefined) return
      choose(data(found.set, 'tabs'), next.textContent)
      next.focus()
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [label])
  return null
}
