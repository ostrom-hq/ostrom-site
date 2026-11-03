// SPDX-License-Identifier: Apache-2.0
// docker/site-config.sh, run at container start: the page's settings and the Content-Security-Policy header nginx adds.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const script = join(process.cwd(), 'docker/site-config.sh')

/** The test's environment, without any analytics setting the machine running it may have. */
function scriptEnvironment(extra: Record<string, string>): NodeJS.ProcessEnv {
  return { ...process.env, OSTROM_POSTHOG_API_KEY: '', OSTROM_POSTHOG_HOST: '', ...extra }
}

function run(
  environment: Record<string, string>,
  connect = 'https://app.ostrom.run https://api.ostrom.run\n',
): { config: unknown; header: string } {
  const dir = mkdtempSync(join(tmpdir(), 'site-config-'))
  const connectFile = join(dir, 'connect-src.txt')
  writeFileSync(connectFile, connect)
  try {
    execFileSync('sh', [script], {
      env: scriptEnvironment({
        OSTROM_SITE_CONFIG_DIR: dir,
        OSTROM_CONNECT_SRC_FILE: connectFile,
        ...environment,
      }),
      stdio: 'pipe',
    })
    const config: unknown = JSON.parse(readFileSync(join(dir, 'site-config.json'), 'utf8'))
    return { config, header: readFileSync(join(dir, 'ostrom-csp.conf'), 'utf8') }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const connectSrc = (header: string): string => /connect-src ([^;"]*)/.exec(header)?.[1] ?? ''

describe('site-config.sh', () => {
  it('lets the pages connect to the site, the console, the API and the analytics host, nowhere else', () => {
    const { config, header } = run({ OSTROM_POSTHOG_API_KEY: 'phc_abc' })
    expect(config).toEqual({ posthogKey: 'phc_abc', posthogHost: 'https://eu.i.posthog.com' })
    expect(connectSrc(header)).toBe(
      "'self' https://app.ostrom.run https://api.ostrom.run https://eu.i.posthog.com",
    )
    expect(header).toMatch(/^add_header Content-Security-Policy ".*" always;\n$/)
    for (const directive of [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self' mailto:",
    ]) {
      expect(header).toContain(directive)
    }
  })

  it('keeps only the origin of an analytics host with a path', () => {
    const { header } = run({ OSTROM_POSTHOG_HOST: 'https://ph.example.test/ingest' })
    expect(connectSrc(header)).toBe(
      "'self' https://app.ostrom.run https://api.ostrom.run https://ph.example.test",
    )
  })

  it('drops a host that is not https or that could break the header', () => {
    for (const host of [
      'http://ph.example.test',
      'https://ph.example.test" always; add_header X "y',
      "https://a.test 'unsafe-eval'",
    ]) {
      const { config, header } = run({ OSTROM_POSTHOG_HOST: host })
      expect(config).toEqual({ posthogKey: '', posthogHost: '' })
      expect(connectSrc(header)).toBe("'self' https://app.ostrom.run https://api.ostrom.run")
      expect(header.split('add_header')).toHaveLength(2)
    }
  })

  it('drops a build origin that is not a plain http(s) origin', () => {
    const { header } = run({}, "https://app.ostrom.run 'unsafe-inline' javascript:x https://a.test\";x\n")
    expect(connectSrc(header)).toBe("'self' https://app.ostrom.run https://eu.i.posthog.com")
  })

  it('refuses to start without the origins written at build', () => {
    const dir = mkdtempSync(join(tmpdir(), 'site-config-'))
    try {
      expect(() =>
        execFileSync('sh', [script], {
          env: scriptEnvironment({ OSTROM_SITE_CONFIG_DIR: dir, OSTROM_CONNECT_SRC_FILE: join(dir, 'none') }),
          stdio: 'pipe',
        }),
      ).toThrow()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
