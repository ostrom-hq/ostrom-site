// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {chmodSync} from "node:fs"
import {join, relative} from "node:path"
import {test} from "node:test"
import {missingRequirement, runPage, runTree} from "../src/doctest.mjs"
import {FENCE, page, tree} from "./helpers.mjs"

const statuses = (results) => results.map((result) => [result.line, result.status])

test("files are written, sh and js run in order in the same folder, output is compared", () => {
    const body = [
        `${FENCE}json file="data.json"`,
        '{"n": 2}',
        FENCE,
        `${FENCE}sh test`,
        "cat data.json   ",
        FENCE,
        `${FENCE}text output`,
        '{"n": 2}',
        FENCE,
        `${FENCE}js test`,
        'import {readFileSync} from "node:fs"',
        'console.log(JSON.parse(readFileSync("data.json", "utf8")).n * 2)',
        FENCE,
        `${FENCE}text output`,
        "5",
        FENCE,
        `${FENCE}text notest="illustration"`,
        "never run",
        FENCE,
    ].join("\n")
    const results = runPage(page(body))
    assert.deepEqual(statuses(results), [[9, "pass"], [12, "pass"], [15, "pass"], [19, "fail"]])
    assert.match(results[3].message, /expected\n5\n--- got\n4/)
})

test("a failing block, an expected exit code, and an output after a failure", () => {
    const body = [`${FENCE}sh test`, "echo boom >&2; exit 3", FENCE, `${FENCE}text output`, "x", FENCE, `${FENCE}sh test exit="3"`, "exit 3", FENCE].join("\n")
    const results = runPage(page(body))
    assert.deepEqual(statuses(results), [[6, "fail"], [9, "skip"], [12, "pass"]])
    assert.match(results[0].message, /exited 3, expected 0\nboom/)
})

test("an output with no test before it is skipped", () => {
    assert.deepEqual(statuses(runPage(page(`${FENCE}text output\nx\n${FENCE}`))), [[6, "skip"]])
})

test("a file name with a folder is refused", () => {
    const results = runPage(page(`${FENCE}json file="../x.json"\n{}\n${FENCE}`))
    assert.deepEqual(statuses(results), [[6, "fail"]])
})

test("requirements: skipped locally, failed in strict mode, met when the variables are set", () => {
    const body = `${FENCE}sh test requires="ostrom, server"\nostrom\n${FENCE}`
    assert.deepEqual(statuses(runPage(page(body), {env: {PATH: process.env.PATH}})), [[6, "skip"]])
    assert.deepEqual(statuses(runPage(page(body), {env: {PATH: process.env.PATH}, strict: true})), [[6, "fail"]])
    const bin = tree({"ostrom-fake": "#!/bin/sh\necho fake\n"})
    chmodSync(join(bin, "ostrom-fake"), 0o755)
    const env = {PATH: process.env.PATH, OSTROM_BIN: relative(process.cwd(), join(bin, "ostrom-fake")), OSTROM_URL: "http://127.0.0.1:1"}
    const [result] = runPage(page(body), {env})
    assert.deepEqual([result.status, result.stdout], ["pass", "fake\n"])
})

test("missingRequirement names what is missing", () => {
    assert.equal(missingRequirement({}, {}), undefined)
    assert.equal(missingRequirement({requires: "server"}, {}), "server (set OSTROM_URL)")
    assert.equal(missingRequirement({requires: "gpu"}, {}), "unknown requirement gpu")
})

test("a block that cannot start reports why", () => {
    const results = runPage(page(`${FENCE}sh test\necho\n${FENCE}`), {env: {PATH: "/nonexistent"}})
    assert.equal(results[0].status, "fail")
    assert.match(results[0].message, /ENOENT/)
})

test("a tree: results carry their file", () => {
    const root = tree({"a.mdx": page(`${FENCE}sh test\ntrue\n${FENCE}`), "b/c.mdx": page("nothing")})
    assert.deepEqual(runTree(root), [{file: "a.mdx", line: 6, status: "pass", message: "sh exited 0", stdout: ""}])
})
