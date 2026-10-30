// SPDX-License-Identifier: Apache-2.0
// The verifier published in the receipt format page, run on every vector: the specification cannot drift from them.
import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {createHash} from "node:crypto"
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {test} from "node:test"
import {pathToFileURL} from "node:url"
import {extractCodeBlocks, parseFrontmatter} from "../src/markdown.mjs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const vectors = JSON.parse(read("../vectors/receipts.json"))
const key = JSON.parse(read("../vectors/key.json"))
const canonicalCases = JSON.parse(read("../vectors/canonical.json"))
const {body} = parseFrontmatter(read("../../content/docs/receipts/format.mdx"))
const pageFile = (name) => extractCodeBlocks(body).find((block) => block.meta.file === name).code

const folder = mkdtempSync(join(tmpdir(), "receipt-format-"))
writeFileSync(join(folder, "canonical.mjs"), pageFile("canonical.mjs"))
writeFileSync(join(folder, "verify-receipt.mjs"), pageFile("verify-receipt.mjs"))
writeFileSync(join(folder, "key.pem"), key.publicKeySpkiPem)

function verify(receipt) {
    writeFileSync(join(folder, "receipt.json"), JSON.stringify(receipt))
    return spawnSync(process.execPath, ["verify-receipt.mjs", "receipt.json", "key.pem"], {cwd: folder, encoding: "utf8"})
}

for (const vector of vectors.receipts) {
    test(`the page's verifier accepts the vector receipt ${vector.name}`, () => {
        const run = verify(vector.receipt)
        assert.equal(run.stdout, `valid: ${vector.receipt.id}, signed by key ${key.kid}\n`)
        assert.equal(run.status, 0)
    })
}

test("the page's verifier refuses a signature that is not strict base64", () => {
    const [{receipt}] = vectors.receipts
    for (const sig of [receipt.signature.replace(/==$/, "*"), `${receipt.signature} `, receipt.signature.replace(/sig=/, "sig=!")]) {
        assert.equal(verify({...receipt, signature: sig}).stdout, "invalid: malformed signature\n")
    }
})

test("the page's verifier accepts one spelling of the signature field: no part added, repeated or moved", () => {
    const [{receipt}] = vectors.receipts
    const [algorithm, kid, sha256, sig] = receipt.signature.split(";")
    for (const parts of [[algorithm, sig, sha256, kid], [algorithm, kid, sha256, sig, "extra=1"], [algorithm, kid, kid, sha256, sig], [algorithm, sha256, sig]]) {
        assert.equal(verify({...receipt, signature: parts.join(";")}).stdout, "invalid: malformed signature\n")
    }
    assert.equal(verify({...receipt, signature: ["rsa", kid, sha256, sig].join(";")}).stdout, "invalid: unknown algorithm\n")
})

test("the page's verifier refuses a base64 signature with non-zero padding bits", () => {
    const [{receipt}] = vectors.receipts
    // The last character before "==" carries 2 bits of the signature and 4 bits that must be zero.
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    const last = receipt.signature.at(-3)
    const dirty = alphabet[alphabet.indexOf(last) + 1]
    assert.equal(verify({...receipt, signature: `${receipt.signature.slice(0, -3)}${dirty}==`}).stdout, "invalid: malformed signature\n")
})

test("the page's canonical form gives the vector bytes for every case", async () => {
    const {canonical} = await import(pathToFileURL(join(folder, "canonical.mjs")).href)
    for (const vectorCase of canonicalCases.cases) {
        const text = canonical(JSON.parse(vectorCase.inputJson))
        assert.equal(text, vectorCase.canonical, vectorCase.name)
        assert.equal(createHash("sha256").update(text, "utf8").digest("hex"), vectorCase.sha256, vectorCase.name)
    }
    const [undefinedOmitted] = canonicalCases.codeOnly
    assert.equal(canonical({a: 1, b: undefined, c: [1, undefined]}), undefinedOmitted.canonical)
})
