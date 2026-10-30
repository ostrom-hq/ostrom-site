// SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/serve.ts <export dir> <port>. Serves the export like docker/nginx.conf does (no headers).
import { readdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, relative } from 'node:path'
import { answer, contentType } from './lib/static.ts'

const root = process.argv[2] ?? 'out'
const port = Number(process.argv[3] ?? '3000')
const files = new Set(
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).replace(/\\/g, '/')),
)

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost')
  if (pathname === '/healthz') {
    response.writeHead(200, { 'content-type': 'text/plain' }).end('ok\n')
    return
  }
  const { status, file } = answer(pathname, files)
  if (file === null) {
    response.writeHead(status).end()
    return
  }
  response.writeHead(status, { 'content-type': contentType(file) }).end(readFileSync(join(root, file)))
}).listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${String(port)}`)
})
