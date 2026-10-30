# Receipt format v1 test vectors

Copied byte for byte from the compatibility vectors (`neutral/`), the same files as `ostrom-app`'s
`src/domain/receipts/__fixtures__/`. They are frozen: a vector that changes is a new format version.
`test/receipt-format.test.mjs` runs the verifier published in `content/docs/receipts/format.mdx` on every receipt here.
`key.json` is a test key derived from a public seed: it signs these vectors and nothing else.
