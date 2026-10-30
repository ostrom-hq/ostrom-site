// SPDX-License-Identifier: Apache-2.0
import type { SiteConfig } from '@/lib/site'

interface RepoNameProps {
  readonly name: string
  readonly config: SiteConfig
}

/** A repository's name, linked to GitHub only once the site is launched (the repositories are private until then). */
export function RepoName({ name, config }: RepoNameProps): React.JSX.Element {
  return config.launched ? (
    <a className="mono" href={`${config.githubUrl}/${name}`} rel="noopener">
      {name}
    </a>
  ) : (
    <span className="mono">{name}</span>
  )
}
