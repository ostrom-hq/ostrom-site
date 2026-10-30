// SPDX-License-Identifier: Apache-2.0
import {runTree} from "./doctest.mjs"
import {lintTree} from "./lint.mjs"

const USAGE = "usage: docs-tools lint <docs-dir> | docs-tools run <docs-dir> [--strict]"

/** Runs a command; returns the exit code. `out` and `err` receive whole lines. */
export function main(argv, {out, err, env}) {
    const [command, root, ...flags] = argv
    if (root === undefined || !["lint", "run"].includes(command)) {
        err(USAGE)
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
