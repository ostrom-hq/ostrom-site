// SPDX-License-Identifier: Apache-2.0
import { SYMBOL_PATH, WORDMARK_PATHS } from './geometry'

interface LogoProps {
  /** Only the diaphragm, without the wordmark. */
  readonly symbolOnly?: boolean
  readonly className?: string
}

/** The Ostrom lockup (04·02 « Cordage à lames courbes »): garnet symbol, wordmark in the text colour. */
export function Logo({ symbolOnly = false, className }: LogoProps): React.JSX.Element {
  if (symbolOnly) {
    return (
      <svg className={className} viewBox="-6 -6 76 76" aria-hidden="true" focusable="false">
        <path fill="var(--signal)" fillRule="evenodd" d={SYMBOL_PATH} />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 314.201 64" aria-hidden="true" focusable="false">
      <path fill="var(--signal)" fillRule="evenodd" d={SYMBOL_PATH} />
      {WORDMARK_PATHS.map((d) => (
        <path key={d.slice(0, 24)} fill="currentColor" d={d} />
      ))}
    </svg>
  )
}
