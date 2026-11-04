// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {join} from "node:path"
import {test} from "node:test"
import {checkSnapshot, countOperations, isServed, snapshotBody} from "../src/apisnapshot.mjs"
import {main} from "../src/cli.mjs"
import {tree} from "./helpers.mjs"

const CONTRACT = `openapi: 3.1.0
paths:
  /a:
    get:
      x-ostrom-status: served
    post:
      x-ostrom-status: planned
  /b:
    delete:
      x-ostrom-server: implemented
    parameters: []
  /c: null
`
const HEADER = "# Snapshot of api/openapi.yaml from ostrom-hq/ostrom-core@abc, written by scripts/sync-openapi.ts. Do not edit: sync it.\n"

test("an operation is served when the contract says so, and a misspelled mark is an error", () => {
    assert.equal(isServed({"x-ostrom-status": "served"}, "GET /a"), true)
    assert.equal(isServed({"x-ostrom-server": "implemented"}, "GET /a"), true)
    assert.equal(isServed({"x-ostrom-status": "planned"}, "GET /a"), false)
    assert.equal(isServed({}, "GET /a"), false)
    assert.throws(() => isServed({"x-ostrom-server": "Implemented"}, "POST /x"), /POST \/x: x-ostrom-server must be "implemented", not "Implemented"/)
    assert.throws(() => isServed({"x-ostrom-status": "Served"}, "POST /x"), /POST \/x: x-ostrom-status must be "served" or "planned", not "Served"/)
})

test("counts the operations and the served ones", () => {
    assert.deepEqual(countOperations({paths: {"/a": {get: {"x-ostrom-status": "served"}, post: {}}, "/b": null}}), {served: 1, total: 2})
    assert.deepEqual(countOperations({}), {served: 0, total: 0})
    assert.deepEqual(countOperations(null), {served: 0, total: 0})
})

test("reads the contract inside a snapshot", () => {
    assert.equal(snapshotBody(`${HEADER}${CONTRACT}`), CONTRACT)
    assert.equal(snapshotBody(CONTRACT), CONTRACT)
})

test("a snapshot is the contract byte for byte, or it drifted", () => {
    assert.deepEqual(checkSnapshot(CONTRACT, `${HEADER}${CONTRACT}`), {problems: [], served: 2, total: 3})
    assert.match(checkSnapshot(CONTRACT, `${HEADER}${CONTRACT}# more\n`).problems[0], /^the snapshot is not this contract/)
})

test("api-snapshot: served, drifted, usage and an unreadable file", () => {
    const folder = tree({"contract.yaml": CONTRACT, "snapshot.yaml": `${HEADER}${CONTRACT}`, "old.yaml": `${HEADER}openapi: 3.1.0\n`})
    const run = (argv) => {
        const out = []
        const err = []
        const code = main(argv, {out: (line) => out.push(line), err: (line) => err.push(line), env: {}})
        return {code, out, err}
    }
    assert.deepEqual(run(["api-snapshot", join(folder, "contract.yaml"), join(folder, "snapshot.yaml")]), {code: 0, out: ["api-snapshot: 2 of 3 operations served"], err: []})
    const drifted = run(["api-snapshot", join(folder, "contract.yaml"), join(folder, "old.yaml")])
    assert.equal(drifted.code, 1)
    assert.match(drifted.err[0], /^api-snapshot: the snapshot is not this contract/)
    assert.equal(run(["api-snapshot", join(folder, "contract.yaml")]).code, 2)
    const missing = run(["api-snapshot", "/nonexistent.yaml", join(folder, "snapshot.yaml")])
    assert.equal(missing.code, 1)
    assert.match(missing.err[0], /^api-snapshot: ENOENT/)
})
