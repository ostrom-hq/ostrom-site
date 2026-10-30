'use client'

import { useEffect, useState } from 'react'
import { format, type Messages } from '@/i18n'
import { check, probes, type Fetcher, type Health, type Probe } from '@/lib/status'

interface StatusBoardProps {
  readonly labels: Messages['status']
  readonly config: { readonly siteUrl: string; readonly appUrl: string; readonly apiUrl: string }
  /** Injected for tests; the browser's fetch otherwise. */
  readonly fetcher?: Fetcher
  readonly intervalMs?: number
}

type Results = Readonly<Record<Probe['id'], Health>>

const CHECKING: Results = { site: 'checking', console: 'checking', api: 'checking' }

export function StatusBoard({
  labels,
  config,
  fetcher,
  intervalMs = 60_000,
}: StatusBoardProps): React.JSX.Element {
  const [results, setResults] = useState<Results>(CHECKING)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  useEffect(() => {
    const list = probes(config)
    const run = async (): Promise<void> => {
      const doFetch: Fetcher = fetcher ?? ((url, init) => fetch(url, init))
      const healths = await Promise.all(
        list.map(async (probe) => [probe.id, await check(probe, doFetch)] as const),
      )
      setResults(healths.reduce<Results>((next, [id, health]) => ({ ...next, [id]: health }), CHECKING))
      setCheckedAt(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
    }
    void run()
    const timer = window.setInterval(() => {
      void run()
    }, intervalMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [config, fetcher, intervalMs])

  return (
    <div className="status">
      <ul className="status__list">
        {(['site', 'console', 'api'] as const).map((id) => (
          <li key={id} className="status__row" data-health={results[id]}>
            <span className="status__name">{labels.components[id]}</span>
            <span className="status__value">
              <span className="status__dot" aria-hidden="true" />
              {labels[results[id]]}
            </span>
          </li>
        ))}
      </ul>
      <p className="small muted" aria-live="polite">
        {checkedAt === null ? labels.checking : format(labels.checkedAt, { time: checkedAt })}
      </p>
    </div>
  )
}
