// SPDX-License-Identifier: Apache-2.0
// Next.js's runtime starts once the page is shown. The exported HTML is complete without it, and on a slow phone its
// scripts (about 150 kB compressed) otherwise compete with the first paint. Their tags and preloads are replaced by a
// loader that adds them, in their order, after the load event at the first idle moment, or at the first touch, key
// press or focus, whichever comes first. Inline scripts (theme, React payload) and nomodule scripts are left as they
// are.
import { orEmpty } from './links.ts'

const SCRIPT = /<script\b(?![^>]*\bnoModule)[^>]*\bsrc="(\/_next\/[^"]+\.js)"[^>]*><\/script>/gi
const PRELOAD = /<link\b(?=[^>]*\bas="script")[^>]*>/g
const MODULE_PRELOAD = /<link\b(?=[^>]*\brel="modulepreload")[^>]*>/g

/** The inline loader for these scripts, in ES5: it runs before any polyfill. */
export function loader(sources: readonly string[]): string {
  return [
    '(function(){var d=document,w=window,s=',
    JSON.stringify(sources),
    ',done=false;function go(){if(done)return;done=true;s.forEach(function(u){var e=d.createElement("script");',
    'e.src=u;e.async=false;d.body.appendChild(e)})}',
    '["pointerdown","keydown","touchstart","focusin"].forEach(function(t){w.addEventListener(t,go,{once:true,passive:true,capture:true})});',
    'function idle(){if(w.requestIdleCallback)w.requestIdleCallback(go,{timeout:2000});else setTimeout(go,1)}',
    'if(d.readyState==="complete")idle();else w.addEventListener("load",idle)})()',
  ].join('')
}

/** The page with Next.js's scripts started by the loader instead of the parser; unchanged when it has none. */
export function deferRuntime(html: string): string {
  const sources = [...html.matchAll(SCRIPT)].map((match) => orEmpty(match[1]))
  if (sources.length === 0) return html
  const stripped = html.replace(SCRIPT, '').replace(PRELOAD, '').replace(MODULE_PRELOAD, '')
  const tag = `<script>${loader(sources)}</script>`
  return stripped.includes('</body>') ? stripped.replace('</body>', `${tag}</body>`) : `${stripped}${tag}`
}
