// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {fileURLToPath} from "node:url"
import {test} from "node:test"
import {main} from "../src/cli.mjs"
import {FENCE, page, tree} from "./helpers.mjs"

function capture(argv, env = process.env) {
    const out = []
    const err = []
    const code = main(argv, {out: (line) => out.push(line), err: (line) => err.push(line), env})
    return {code, out, err}
}

const clean = () => tree({"meta.json": '{"title": "Docs", "pages": ["index"]}', "index.mdx": page(`${FENCE}sh test\necho hi\n${FENCE}`)})

test("usage on a bad command", () => {
    assert.deepEqual(capture([]).code, 2)
    assert.deepEqual(capture(["build", "x"]).err, ["usage: docs-tools lint <docs-dir> | docs-tools run <docs-dir> [--strict]"])
})

test("unknown flags and missing folders are refused", () => {
    assert.equal(capture(["run", clean(), "--strcit"]).code, 2)
    assert.equal(capture(["lint", clean(), "--strict"]).code, 2)
    assert.equal(capture(["run", clean(), clean()]).code, 2)
    assert.equal(capture(["run", "--strict", clean()]).code, 0, "flags may come before the folder")
    assert.deepEqual(capture(["run", "--strict"]).err, ["usage: docs-tools lint <docs-dir> | docs-tools run <docs-dir> [--strict]"])
    assert.deepEqual(capture(["lint", "/nonexistent/docs"]), {code: 2, out: [], err: ["not a folder: /nonexistent/docs"]})
    const file = tree({"a.mdx": ""})
    assert.deepEqual(capture(["run", `${file}/a.mdx`]).err, [`not a folder: ${file}/a.mdx`])
})

test("lint: clean, then with problems", () => {
    assert.deepEqual(capture(["lint", clean()]), {code: 0, out: ["docs-lint: every page is clean"], err: []})
    const dirty = tree({"meta.json": '{"title": "Docs", "pages": ["index"]}', "index.mdx": "no frontmatter"})
    assert.deepEqual(capture(["lint", dirty]), {code: 1, out: ["docs-lint: 1 problem(s)"], err: ["index.mdx:1: missing frontmatter"]})
})

test("run: passes, fails, strict", () => {
    assert.deepEqual(capture(["run", clean()]).out, ["PASS index.mdx:6 sh exited 0", "docs-test: 1 passed, 0 failed, 0 skipped"])
    const failing = tree({"index.mdx": page(`${FENCE}sh test\nexit 1\n${FENCE}`)})
    const result = capture(["run", failing])
    assert.equal(result.code, 1)
    assert.match(result.err[0], /^FAIL index.mdx:6 exited 1/)
    const needs = tree({"index.mdx": page(`${FENCE}sh test requires="server"\ntrue\n${FENCE}`)})
    assert.equal(capture(["run", needs, "--strict"], {PATH: process.env.PATH}).code, 1)
})

test("the binary runs end to end", () => {
    const bin = fileURLToPath(new URL("../bin/docs-tools.mjs", import.meta.url))
    const run = spawnSync(process.execPath, [bin, "lint", clean()], {encoding: "utf8"})
    assert.equal(run.status, 0)
    assert.equal(run.stdout, "docs-lint: every page is clean\n")
})
