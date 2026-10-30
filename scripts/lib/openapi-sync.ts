// SPDX-License-Identifier: Apache-2.0
// The snapshot of the API contract the docs are generated from: ostrom-core/api/openapi.yaml, copied into
// content/api/openapi.yaml (committed, so a build never needs the network). Pure logic; scripts/sync-openapi.ts runs it.
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

export const CORE_REPOSITORY = 'ostrom-hq/ostrom-core'
export const CORE_PATH = 'api/openapi.yaml'
export const SNAPSHOT_PATH = 'content/api/openapi.yaml'

export type SyncSource =
  { readonly kind: 'file'; readonly path: string } | { readonly kind: 'github'; readonly ref: string }

const USAGE =
  'usage: node scripts/sync-openapi.ts [--from <path to openapi.yaml> | --ref <git ref of ostrom-core>]'

/** `--from <file>` copies a local file (a worktree of ostrom-core); `--ref <ref>` reads GitHub (default: main). */
export function parseArguments(argv: readonly string[]): SyncSource {
  const [flag, value, ...rest] = argv
  if (rest.length > 0 || (flag !== undefined && value === undefined)) throw new Error(USAGE)
  if (flag === undefined) return { kind: 'github', ref: 'main' }
  if (flag === '--from' && value !== undefined) return { kind: 'file', path: value }
  if (flag === '--ref' && value !== undefined) return { kind: 'github', ref: value }
  throw new Error(USAGE)
}

/** The `gh` arguments that print the raw file of ostrom-core at `ref`. */
export function githubArguments(ref: string): string[] {
  return [
    'api',
    '-H',
    'Accept: application/vnd.github.raw',
    `repos/${CORE_REPOSITORY}/contents/${CORE_PATH}?ref=${encodeURIComponent(ref)}`,
  ]
}

const contract = z.object({
  openapi: z.string().regex(/^3\.1\.\d+$/, 'the contract must be OpenAPI 3.1'),
  info: z.object({ title: z.string(), version: z.string() }),
  paths: z.record(z.string(), z.unknown()),
})

/** Checks that the text is an OpenAPI 3.1 description before it replaces the snapshot; returns its version. */
export function validateContract(text: string): string {
  const parsed = contract.safeParse(parseYaml(text))
  if (!parsed.success) throw new Error(`not an OpenAPI 3.1 description: ${z.prettifyError(parsed.error)}`)
  return parsed.data.info.version
}

/** The snapshot as committed: a header that says where it comes from, then the contract byte for byte. */
export function snapshotText(text: string, source: SyncSource): string {
  const origin = source.kind === 'file' ? source.path : `${CORE_REPOSITORY}@${source.ref}`
  return `# Snapshot of ${CORE_PATH} from ${origin}, written by scripts/sync-openapi.ts. Do not edit: sync it.\n${text}`
}

export interface SyncIo {
  readonly readFile: (path: string) => string
  readonly runGh: (args: readonly string[]) => string
  readonly writeFile: (path: string, text: string) => void
}

/** Fetches, checks and writes the snapshot; returns a one-line report. */
export function syncOpenApi(source: SyncSource, io: SyncIo): string {
  const text = source.kind === 'file' ? io.readFile(source.path) : io.runGh(githubArguments(source.ref))
  const version = validateContract(text)
  io.writeFile(SNAPSHOT_PATH, snapshotText(text, source))
  return `${SNAPSHOT_PATH}: API ${version}, ${String(text.split('\n').length)} lines.`
}
