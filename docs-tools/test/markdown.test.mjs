// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {test} from "node:test"
import {extractCodeBlocks, parseFrontmatter, parseMeta, proseLines} from "../src/markdown.mjs"
import {FENCE} from "./helpers.mjs"

test("frontmatter: scalar values, quoted values decoded, body line counted", () => {
    const parsed = parseFrontmatter('---\ntitle: Hello\ndescription: "a \\"b\\""\n---\nbody')
    assert.deepEqual(parsed, {data: {title: "Hello", description: 'a "b"'}, body: "body", bodyLine: 5})
})

test("frontmatter: a lone quote is kept as text", () => {
    assert.equal(parseFrontmatter('---\nx: "\n---\n').data.x, '"')
})

test("frontmatter: missing, unterminated, or malformed", () => {
    assert.equal(parseFrontmatter("no").error, "missing frontmatter")
    assert.equal(parseFrontmatter("---\ntitle: a").error, "unterminated frontmatter")
    assert.equal(parseFrontmatter("---\n- list\n---\n").error, "bad frontmatter line: - list")
})

test("meta: flags, values with escapes, leftover text", () => {
    assert.deepEqual(parseMeta('test requires="ostrom" note="a \\"q\\""'), {meta: {test: true, requires: "ostrom", note: 'a "q"'}, leftover: ""})
    assert.deepEqual(parseMeta('notest="x" !!'), {meta: {notest: "x"}, leftover: "!!"})
})

test("code blocks: language, meta, line, nested longer fences, tildes, unterminated", () => {
    const body = [
        "intro",
        `${FENCE}sh test`,
        "echo hi",
        FENCE,
        `${FENCE}${FENCE[0]}md notest="shows a fence"`,
        FENCE,
        "inner",
        FENCE,
        `${FENCE}${FENCE[0]}`,
        "~~~",
        "plain",
        "~~~",
        `${FENCE}json file="a.json"`,
        "{}",
    ].join("\n")
    const blocks = extractCodeBlocks(body, 10)
    assert.deepEqual(blocks.map((block) => [block.lang, block.line, block.code, Boolean(block.unterminated)]), [
        ["sh", 11, "echo hi", false],
        ["md", 14, `${FENCE}\ninner\n${FENCE}`, false],
        ["", 19, "plain", false],
        ["json", 22, "{}", true],
    ])
    assert.deepEqual(blocks[0].meta, {test: true})
    assert.equal(blocks[2].leftover, "")
})

test("a fence with text after it does not close a block", () => {
    const blocks = extractCodeBlocks(`${FENCE}sh test\n${FENCE}js\n${FENCE}`)
    assert.equal(blocks[0].code, `${FENCE}js`)
})

test("prose: code removed, lines kept", () => {
    const body = ["a `<x>` b", FENCE, "<hidden>", FENCE, "~~~", "{}", "~~~", "c ``{y}`` d"].join("\n")
    assert.deepEqual(proseLines(body, 3), [
        {line: 3, text: "a  b"},
        {line: 10, text: "c  d"},
    ])
})
