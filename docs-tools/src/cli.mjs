// SPDX-License-Identifier: Apache-2.0
import {existsSync, statSync} from "node:fs"
import {runTree} from "./doctest.mjs"
import {lintTree} from "./lint.mjs"

const USAGE = "usage: docs-tools lint <docs-dir> | docs-tools run <docs-dir> [--strict]"

/** Runs a command; returns the exit code. `out` and `err` receive whole lines. */
export function main(argv, {out, err, env}) {
    const [command, ...rest] = argv
    const flags = rest.filter((arg) => arg.startsWith("-"))
    const [root, ...extra] = rest.filter((arg) => !arg.startsWith("-"))
    const allowed = command === "run" ? ["--strict"] : []
    if (root === undefined || extra.length > 0 || !["lint", "run"].includes(command) || flags.some((flag) => !allowed.includes(flag))) {
        err(USAGE)
        return 2
    }
    if (!existsSync(root) || !statSync(root).isDirectory()) {
        err(`not a folder: ${root}`)
        return 2
    }
    if (command === "lint") {
        const problems = lintTree(root)
        for (const {file, line, message} of problems) err(`${file}:${line}: ${message}`)
        out(problems.length === 0 ? "docs-lint: every page is clean" : `docs-lint: ${problems.length} problem(s)`)
        return problems.length === 0 ? 0 : 1
    }
    const results = runTree(root, {env, strict: flags.includes("--strict")})
    const count = (status) => results.filter((result) => result.status === status).length
    for (const {file, line, status, message} of results) (status === "fail" ? err : out)(`${status.toUpperCase()} ${file}:${line} ${message}`)
    out(`docs-test: ${count("pass")} passed, ${count("fail")} failed, ${count("skip")} skipped`)
    return count("fail") === 0 ? 0 : 1
}
