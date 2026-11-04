// SPDX-License-Identifier: Apache-2.0
// The site's snapshot of the API contract (content/api/openapi.yaml, written by scripts/sync-openapi.ts) against the
// contract itself. The API reference at /docs/api/ is built from the snapshot: a snapshot that is not the contract
// byte for byte is a reference that drifted.
import {parse} from "yaml"

const METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"]
const HEADER = "# Snapshot of "

/**
 * True for an operation the server serves. The contract marks it `x-ostrom-status: served` (or `planned`), checked by
 * ostrom-core against what ostrom-server main serves; the older `x-ostrom-server: implemented` still counts. Any other
 * value is a typo.
 */
export function isServed(operation, where) {
    const mark = operation["x-ostrom-server"]
    if (mark !== undefined && mark !== "implemented") throw new Error(`${where}: x-ostrom-server must be "implemented", not ${JSON.stringify(mark)}`)
    const status = operation["x-ostrom-status"]
    if (status !== undefined && status !== "served" && status !== "planned") throw new Error(`${where}: x-ostrom-status must be "served" or "planned", not ${JSON.stringify(status)}`)
    return mark === "implemented" || status === "served"
}

/** How many operations the contract describes, and how many of them the server serves. */
export function countOperations(spec) {
    let total = 0
    let served = 0
    for (const [path, item] of Object.entries(spec?.paths ?? {})) {
        if (item == null) continue
        for (const method of METHODS) {
            const operation = item[method]
            if (operation == null) continue
            total += 1
            if (isServed(operation, `${method.toUpperCase()} ${path}`)) served += 1
        }
    }
    return {served, total}
}

/** The contract inside a snapshot: everything after its header line. */
export function snapshotBody(text) {
    return text.startsWith(HEADER) ? text.slice(text.indexOf("\n") + 1) : text
}

/** The snapshot against the contract: its problems (none when it is the contract) and the operations it serves. */
export function checkSnapshot(contract, snapshot) {
    const problems = snapshotBody(snapshot) === contract ? [] : ["the snapshot is not this contract: run scripts/sync-openapi.ts --ref <the ostrom-core commit>"]
    return {problems, ...countOperations(parse(contract))}
}
