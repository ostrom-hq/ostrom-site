// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {chmodSync, readFileSync} from "node:fs"
import {join} from "node:path"
import {test} from "node:test"
import {generateCliReference, parseCommands} from "../src/clireference.mjs"
import {main} from "../src/cli.mjs"
import {lintPage} from "../src/lint.mjs"
import {runPage} from "../src/doctest.mjs"
import {tree} from "./helpers.mjs"

// Help texts in Clikt 5's layout, as `ostrom` prints them.
const HELP = {
    "": [
        "Usage: ostrom [<options>] <command> [<args>]...",
        "",
        "  Run coding agents under your team's harness.",
        "",
        "Options:",
        "  --debug     Print codes and HTTP statuses (never a secret)",
        "  -h, --help  Show this message and exit",
        "",
        "Commands:",
        "  claude    Start Claude Code under your team's harness",
        "  harness   Harnesses: list, show, add {admin}",
        "            a second line of the summary",
        "  doctor",
        "",
        "Agents and their hooks also call: wait, hook.",
        "",
    ].join("\n"),
    claude: "Usage: ostrom claude [<options>]\n\n  Start Claude Code under your team's harness\n",
    harness: "Usage: ostrom harness <command>\n\nCommands:\n  list  Harnesses applied to this repository\n\n",
    "harness list": "Usage: ostrom harness list\n",
    doctor: "Usage: ostrom doctor\n",
}
const help = (path) => HELP[path.join(" ")]

test("parseCommands reads the Commands section only", () => {
    assert.deepEqual(parseCommands(HELP[""]), [
        {name: "claude", summary: "Start Claude Code under your team's harness"},
        {name: "harness", summary: "Harnesses: list, show, add {admin}"},
        {name: "doctor", summary: ""},
    ])
    assert.deepEqual(parseCommands("Usage: ostrom doctor\n"), [])
})

test("the page lists every command depth first, MDX-safe, and lints clean", () => {
    const page = generateCliReference(help)
    assert.deepEqual([...page.matchAll(/^## `(.+)`$/gm)].map((match) => match[1]), ["ostrom", "ostrom claude", "ostrom harness", "ostrom harness list", "ostrom doctor"])
    assert.match(page, /^`Harnesses: list, show, add \{admin\}`$/m)
    assert.deepEqual(lintPage(page, new Set()), [])
})

test("depth is bounded", () => {
    const page = generateCliReference(help, {maxDepth: 1})
    assert.equal(page.includes("ostrom harness list"), false)
})

test("a command whose help fails stops the generation", () => {
    assert.throws(() => generateCliReference((path) => (path.length === 0 ? HELP[""] : undefined)), /ostrom claude --help failed/)
})

test("cli-reference writes a page that docs-test then passes against the same binary", () => {
    const script = ["#!/bin/sh", 'key="$*"', 'case "$key" in', ...Object.entries(HELP).map(([path, text]) => `  "${path ? `${path} ` : ""}--help") printf '%s' '${text.replaceAll("'", "'\\''")}' ;;`), "  *) exit 1 ;;", "esac"].join("\n")
    const folder = tree({ostrom: script})
    chmodSync(join(folder, "ostrom"), 0o755)
    const page = join(folder, "cli.mdx")
    const out = []
    assert.equal(main(["cli-reference", join(folder, "ostrom"), page], {out: (line) => out.push(line), err: () => {}, env: process.env}), 0)
    assert.deepEqual(out, [`cli-reference: wrote ${page}`])
    const results = runPage(readFileSync(page, "utf8"), {env: {...process.env, OSTROM_BIN: join(folder, "ostrom")}, strict: true})
    assert.deepEqual(new Set(results.map((result) => result.status)), new Set(["pass"]))
    assert.equal(results.length, 10)
})

test("cli-reference: usage and failures", () => {
    const err = []
    const io = {out: () => {}, err: (line) => err.push(line), env: process.env}
    assert.equal(main(["cli-reference", "only-one"], io), 2)
    const folder = tree({ostrom: "#!/bin/sh\nexit 3\n"})
    chmodSync(join(folder, "ostrom"), 0o755)
    assert.equal(main(["cli-reference", join(folder, "ostrom"), join(folder, "cli.mdx")], io), 1)
    assert.equal(err.at(-1), "cli-reference: ostrom --help failed")
})
