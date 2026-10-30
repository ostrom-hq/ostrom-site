import {
  githubArguments,
  parseArguments,
  snapshotText,
  SNAPSHOT_PATH,
  syncOpenApi,
  validateContract,
  type SyncIo,
} from './openapi-sync'

const contract = 'openapi: 3.1.0\ninfo:\n  title: Ostrom API\n  version: 0.1.0\npaths: {}\n'

function io(text: string): SyncIo & { readonly written: Map<string, string>; readonly calls: string[][] } {
  const written = new Map<string, string>()
  const calls: string[][] = []
  return {
    written,
    calls,
    readFile: () => text,
    runGh: (args) => {
      calls.push([...args])
      return text
    },
    writeFile: (path, content) => {
      written.set(path, content)
    },
  }
}

describe('parseArguments', () => {
  it('reads main on GitHub by default, a ref or a local file when asked', () => {
    expect(parseArguments([])).toEqual({ kind: 'github', ref: 'main' })
    expect(parseArguments(['--ref', 'feat/x'])).toEqual({ kind: 'github', ref: 'feat/x' })
    expect(parseArguments(['--from', '../core/api/openapi.yaml'])).toEqual({
      kind: 'file',
      path: '../core/api/openapi.yaml',
    })
  })

  it('refuses anything else', () => {
    expect(() => parseArguments(['--from'])).toThrow('usage')
    expect(() => parseArguments(['--to', 'x'])).toThrow('usage')
    expect(() => parseArguments(['--ref', 'a', 'b'])).toThrow('usage')
  })
})

describe('githubArguments', () => {
  it('asks gh for the raw file at the ref', () => {
    expect(githubArguments('feat/a b')).toEqual([
      'api',
      '-H',
      'Accept: application/vnd.github.raw',
      'repos/ostrom-hq/ostrom-core/contents/api/openapi.yaml?ref=feat%2Fa%20b',
    ])
  })
})

describe('validateContract', () => {
  it('returns the version of an OpenAPI 3.1 description', () => {
    expect(validateContract(contract)).toBe('0.1.0')
  })

  it('refuses another version or another file', () => {
    expect(() => validateContract(contract.replace('3.1.0', '3.0.3'))).toThrow('OpenAPI 3.1')
    expect(() => validateContract('just: text\n')).toThrow('not an OpenAPI 3.1 description')
  })
})

describe('syncOpenApi', () => {
  it('copies a local file under a header that names it', () => {
    const files = io(contract)
    expect(syncOpenApi({ kind: 'file', path: 'core/openapi.yaml' }, files)).toBe(
      `${SNAPSHOT_PATH}: API 0.1.0, 6 lines.`,
    )
    expect(files.written.get(SNAPSHOT_PATH)).toBe(
      snapshotText(contract, { kind: 'file', path: 'core/openapi.yaml' }),
    )
    expect(files.written.get(SNAPSHOT_PATH)?.split('\n')[0]).toContain('from core/openapi.yaml')
  })

  it('reads GitHub through gh', () => {
    const files = io(contract)
    syncOpenApi({ kind: 'github', ref: 'main' }, files)
    expect(files.calls).toEqual([githubArguments('main')])
    expect(files.written.get(SNAPSHOT_PATH)).toContain('from ostrom-hq/ostrom-core@main')
  })

  it('writes nothing when the contract is not valid', () => {
    const files = io('openapi: 2.0\n')
    expect(() => syncOpenApi({ kind: 'github', ref: 'main' }, files)).toThrow()
    expect(files.written.size).toBe(0)
  })
})
