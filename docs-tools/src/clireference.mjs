// SPDX-License-Identifier: Apache-2.0
// Writes the CLI reference page from the binary's own help, so the page cannot say what the binary does not.
// Each command's help goes in a tested block followed by its output: docs-test reruns it against the real binary.

const FENCE = "```"

/** The subcommands listed in a Clikt help text: the `Commands:` section, one `  name  summary` line each. */
export function parseCommands(help) {
    const lines = help.split("\n")
    const start = lines.findIndex((line) => line.trim() === "Commands:")
    if (start === -1) return []
    const commands = []
    for (const line of lines.slice(start + 1)) {
        if (line.trim() === "") break
        const match = /^ {2}([a-z][\w-]*)(?: {2,}(.*))?$/.exec(line)
        if (match !== null) commands.push({name: match[1], summary: (match[2] ?? "").trim()})
    }
    return commands
}

/** Prose that MDX reads as text: anything with `<`, `{` or `}` goes in code. */
function mdxSafe(text) {
    return /[<{}`]/.test(text) ? `\`${text.replaceAll("`", "'")}\`` : text
}

/**
 * The whole reference page. `help(path)` returns the help text of `ostrom <path...> --help`, or undefined when the
 * binary refused it. Depth-first, in the binary's own order.
 */
export function generateCliReference(help, {maxDepth = 4} = {}) {
    const sections = []
    const visit = (path, summary) => {
        const text = help(path)
        if (text === undefined) throw new Error(`ostrom ${[...path, "--help"].join(" ")} failed`)
        const command = ["ostrom", ...path].join(" ")
        sections.push(`## \`${command}\``, "")
        if (summary) sections.push(mdxSafe(summary), "")
        sections.push(`${FENCE}sh test requires="ostrom"`, `${command} --help`, FENCE, "", `${FENCE}text output`, text.trimEnd(), FENCE, "")
        if (path.length >= maxDepth) return
        for (const child of parseCommands(text)) visit([...path, child.name], child.summary)
    }
    visit([], "")
    return [
        "---",
        "title: CLI reference",
        'description: "Every ostrom command and option, generated from the binary\'s own help."',
        "status: available",
        "---",
        "",
        `Generated from the binary's own help: every block below is run against the released binary in CI, and must print exactly what is shown. Do not edit this page by hand; run \`docs-tools cli-reference\`.`,
        "",
        ...sections,
    ].join("\n").trimEnd() + "\n"
}
