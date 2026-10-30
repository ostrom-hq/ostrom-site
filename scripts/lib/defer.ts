// SPDX-License-Identifier: Apache-2.0
// Next.js's runtime starts once the page is shown. The exported HTML is complete without it, and on a slow phone its
// scripts (about 150 kB compressed) otherwise compete with the first paint. Their tags and preloads are replaced by a
// loader that adds them, in their order, after the load event and the largest paint, at the first idle moment, or at
// the first touch, key press or focus, whichever comes first. Inline scripts (theme, React payload) and nomodule scripts are left as they
// are.
//
// A press on a button, or a choice in a select, made before React runs the page is not lost: the loader holds it, and
// plays it again once <html data-runtime="ready"> says React listens (components/layout/RuntimeReady.tsx). Links and
// native controls (details, radios, labels) work without the runtime and are left alone.
import { orEmpty } from './links.ts'

const SCRIPT = /<script\b(?![^>]*\bnoModule)[^>]*\bsrc="(\/_next\/[^"]+\.js)"[^>]*><\/script>/gi
const PRELOAD = /<link\b(?=[^>]*\bas="script")[^>]*>/g
const MODULE_PRELOAD = /<link\b(?=[^>]*\brel="modulepreload")[^>]*>/g

/** The inline loader for these scripts, in ES5: it runs before any polyfill. */
export function loader(sources: readonly string[]): string {
  return [
    '(function(){var d=document,w=window,h=d.documentElement,s=',
    JSON.stringify(sources),
    ',done=false,held=null;function go(){if(done)return;done=true;s.forEach(function(u){var e=d.createElement("script");',
    'e.src=u;e.async=false;d.body.appendChild(e)})}',
    'function ready(){return h.getAttribute("data-runtime")==="ready"}',
    '["pointerdown","keydown","touchstart","focusin"].forEach(function(t){w.addEventListener(t,go,{once:true,passive:true,capture:true})});',
    // A button pressed early: the press waits for the runtime.
    'd.addEventListener("click",function(e){if(ready())return;var t=e.target,b=t&&t.closest?t.closest("button,[role=button]"):null;',
    'if(!b||b.disabled)return;e.preventDefault();e.stopPropagation();held={el:b};go()},true);',
    // A select changed early: its value is set again, past React's value tracker, and announced.
    'd.addEventListener("change",function(e){var t=e.target;if(ready()||!t||t.tagName!=="SELECT")return;held={el:t,value:t.value};go()},true);',
    'new MutationObserver(function(m,o){if(!ready())return;o.disconnect();var x=held;held=null;if(!x)return;',
    'if(x.value===undefined){x.el.click();return}',
    'Object.getOwnPropertyDescriptor(Object.getPrototypeOf(x.el),"value").set.call(x.el,x.value);',
    'x.el.dispatchEvent(new Event("change",{bubbles:true}))}).observe(h,{attributes:true,attributeFilter:["data-runtime"]});',
    // After the largest paint, never before: a script requested before it is counted in the mobile LCP that
    // Lighthouse simulates (about 1 s more for these chunks). The observer's callback comes after the paint; without
    // it, two frames; the 3 s timer starts the runtime anyway (a tab opened in the background reports no paint).
    'function painted(f){var n=false,P=w.PerformanceObserver,t=P&&P.supportedEntryTypes,o;',
    'function k(){if(n)return;n=true;if(o)o.disconnect();f()}',
    'if(t&&t.indexOf("largest-contentful-paint")>=0){o=new P(function(){setTimeout(k,0)});',
    'o.observe({type:"largest-contentful-paint",buffered:true})}',
    'else if(w.requestAnimationFrame)w.requestAnimationFrame(function(){w.requestAnimationFrame(function(){setTimeout(k,0)})});',
    'else setTimeout(k,1);setTimeout(k,3000)}',
    'function idle(){painted(function(){if(w.requestIdleCallback)w.requestIdleCallback(go,{timeout:2000});else setTimeout(go,1)})}',
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
