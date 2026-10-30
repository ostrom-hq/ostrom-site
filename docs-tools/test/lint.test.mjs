// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {test} from "node:test"
import {lintMeta, lintPage, lintTree, slugOf} from "../src/lint.mjs"
import {FENCE, page, tree} from "./helpers.mjs"

const messages = (problems) => problems.map((problem) => problem.message)

test("a clean page has no problem", () => {
    const body = [
        "See [quickstart](/docs/quickstart#first) and [docs](/docs/).",
        `${FENCE}json file="r.json"`,
        "{}",
        FENCE,
        `${FENCE}sh test`,
        "echo ok",
        FENCE,
        `${FENCE}text output`,
        "ok",
        FENCE,
        `${FENCE}text notest="sample"`,
        "<anything>",
        FENCE,
        "> a quote with `{code}`",
    ].join("\n")
    assert.deepEqual(lintPage(page(body), new Set(["/docs", "/docs/quickstart"])), [])
})

test("frontmatter problems", () => {
    assert.deepEqual(messages(lintPage("nothing", new Set())), ["missing frontmatter"])
    assert.deepEqual(messages(lintPage("---\nstatus: soon\n---\n", new Set())), [
        "frontmatter: missing title",
        "frontmatter: missing description",
        "frontmatter: status must be one of available, partial, coming-soon",
    ])
    assert.deepEqual(messages(lintPage(page("Later.", "coming-soon"), new Set())), ['a coming-soon page says "Coming soon"'])
    assert.deepEqual(lintPage(page("Coming soon.", "coming-soon"), new Set()), [])
})

test("code block problems", () => {
    const body = [
        `${FENCE}`,
        "x",
        FENCE,
        `${FENCE}sh test notest="both"`,
        FENCE,
        `${FENCE}yaml test`,
        FENCE,
        `${FENCE}text notest`,
        FENCE,
        `${FENCE}json file=""`,
        FENCE,
        `${FENCE}text output`,
        FENCE,
        `${FENCE}sh test ???`,
        FENCE,
        `${FENCE}sh test`,
    ].join("\n")
    assert.deepEqual(messages(lintPage(page(`${FENCE}sh test timeout="9"\n${FENCE}`), new Set())), ["unknown code block attribute: timeout"])
    assert.deepEqual(messages(lintPage(page(`${FENCE}sh test exit="1" exit="2"\n${FENCE}`), new Set())), ["code block attribute repeated: exit"])
    assert.deepEqual(messages(lintPage(page(`${FENCE}sh test exit="one"\n${FENCE}`), new Set())), ['exit needs a number: exit="1"'])
    assert.deepEqual(messages(lintPage(page(`${FENCE}sh test exit requires\n${FENCE}`), new Set())), [
        'exit needs a number: exit="1"',
        'requires needs a value: requires="ostrom"',
    ])
    assert.deepEqual(messages(lintPage(page(`${FENCE}text notest="x" exit="1" requires="server"\n${FENCE}`), new Set())), ["requires and exit go on a test block"])
    assert.deepEqual(lintPage(page(`${FENCE}sh test exit="2" requires="server"\n${FENCE}`), new Set()), [])
    assert.deepEqual(lintPage(page(body), new Set()), [
        {line: 6, message: "code block without a language"},
        {line: 6, message: 'code block needs exactly one of: test, notest="why", file="name", output'},
        {line: 9, message: 'code block needs exactly one of: test, notest="why", file="name", output'},
        {line: 11, message: "test blocks run sh or js, not yaml"},
        {line: 13, message: "notest needs a value"},
        {line: 15, message: "file needs a value"},
        {line: 17, message: "an output block follows a test block"},
        {line: 19, message: "code block info not understood: ???"},
        {line: 21, message: "code block is never closed"},
    ])
})

test("prose problems: JSX characters, import or export, dead links", () => {
    const body = ["Use ostrom <agent>.", "import x from 'y'", "{oops}", "[gone](/docs/gone)"].join("\n")
    assert.deepEqual(messages(lintPage(page(body), new Set())), [
        "prose holds < { or }: put it in `code` (MDX would read it as JSX)",
        "no import or export: pages are plain Markdown",
        "prose holds < { or }: put it in `code` (MDX would read it as JSX)",
        "link to a page that does not exist: /docs/gone",
    ])
})

test("meta.json: invalid JSON, wrong shape, missing and unlisted pages", () => {
    assert.match(messages(lintMeta("{", []))[0], /^meta.json is not JSON/)
    assert.deepEqual(messages(lintMeta('{"title": 1}', [])), ["meta.json needs a title and a pages array"])
    assert.deepEqual(messages(lintMeta('{"title": "x", "pages": ["a", "b"]}', ["b", "c"])), [
        "meta.json lists a missing page: a",
        "meta.json does not list: c",
    ])
})

test("slugs: index stands for its folder", () => {
    assert.equal(slugOf("/r", "/r/index.mdx"), "/docs")
    assert.equal(slugOf("/r", "/r/reference/index.mdx"), "/docs/reference")
    assert.equal(slugOf("/r", "/r/reference/cli.mdx"), "/docs/reference/cli")
})

test("a whole tree: pages, folders, navigation", () => {
    const root = tree({
        "meta.json": '{"title": "Docs", "pages": ["index", "reference"]}',
        "index.mdx": page("[cli](/docs/reference/cli)"),
        "reference/cli.mdx": page("[bad](/docs/nope)"),
        "notes.txt": "ignored",
    })
    assert.deepEqual(lintTree(root), [
        {file: "reference/cli.mdx", line: 6, message: "link to a page that does not exist: /docs/nope"},
        {file: "reference/meta.json", line: 1, message: "folder without meta.json"},
    ])
    const clean = tree({"meta.json": '{"title": "Docs", "pages": ["index"]}', "index.mdx": page("Hi")})
    assert.deepEqual(lintTree(clean), [])
    const nested = tree({"meta.json": '{"title": "Docs", "pages": ["index", "a"]}', "index.mdx": page("Hi"), "a/b/c.mdx": page("Hi")})
    assert.deepEqual(lintTree(`${nested}/`), [
        {file: "a/meta.json", line: 1, message: "folder without meta.json"},
        {file: "a/b/meta.json", line: 1, message: "folder without meta.json"},
    ])
    const images = tree({"meta.json": '{"title": "Docs", "pages": ["index"]}', "index.mdx": page("Hi"), "img/a.png": "png", "empty/x.txt": ""})
    assert.deepEqual(lintTree(images), [])
    const unlisted = tree({"meta.json": '{"title": "Docs", "pages": []}', "index.mdx": page("Hi")})
    assert.deepEqual(messages(lintTree(unlisted)), ["meta.json does not list: index"])
})
