// SPDX-License-Identifier: Apache-2.0
import type { Messages } from '@/i18n'
import type { DocsVersion } from '@/lib/docs/site'

interface VersionSelectProps {
  readonly versions: readonly DocsVersion[]
  readonly current: DocsVersion
  readonly labels: Messages['docs']['versions']
}

/** The version picker: a disclosure of links to each version's home, so it works without a script. */
export function VersionSelect({ versions, current, labels }: VersionSelectProps): React.JSX.Element {
  return (
    <details className="docs-version">
      <summary>
        <span className="visually-hidden">{labels.label}: </span>
        {current.label}
      </summary>
      <ul>
        {versions.map((version) => (
          <li key={version.id}>
            <a href={`${version.basePath}/`} aria-current={version.id === current.id ? 'page' : undefined}>
              {version.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
