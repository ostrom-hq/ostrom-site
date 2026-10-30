import type { Element, Root } from 'hast'
import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import diff from 'shiki/langs/diff.mjs'
import http from 'shiki/langs/http.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import kotlin from 'shiki/langs/kotlin.mjs'
import shellscript from 'shiki/langs/shellscript.mjs'
import toml from 'shiki/langs/toml.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import githubDark from 'shiki/themes/github-dark-default.mjs'
import githubLight from 'shiki/themes/github-light-default.mjs'

// Highlighting happens at build time only: the pages ship coloured HTML and no highlighter. Both themes are emitted as
// CSS variables (--shiki-light, --shiki-dark) that docs.css switches with the site theme. The GitHub "default" themes
// are the ones whose every colour keeps a 4.5:1 contrast on our code background, in light and in dark.
let instance: HighlighterCore | undefined

function highlighter(): HighlighterCore {
  instance ??= createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine({ forgiving: true }),
    themes: [githubLight, githubDark],
    langs: [diff, http, javascript, json, kotlin, shellscript, toml, tsx, typescript, yaml],
  })
  return instance
}

const isElement = (node: Root['children'][number]): node is Element => node.type === 'element'

/** The `<pre>` of a code block, coloured; an unknown language is shown as plain text rather than failing the build. */
export function highlight(code: string, language: string): Element[] {
  const shiki = highlighter()
  const lang = shiki.getLoadedLanguages().includes(language) ? language : 'text'
  const root = shiki.codeToHast(code.replace(/\n$/, ''), {
    lang,
    themes: { light: 'github-light-default', dark: 'github-dark-default' },
    defaultColor: false,
  })
  return root.children.filter(isElement)
}
