import { useId } from 'react'
import { IRIS_CUTS_PATH } from './geometry'

/** The diaphragm: closed while an agent proposes, open on a person's yes (brand/identity/motion/iris.css). */
export type IrisState = 'idle' | 'waiting' | 'approved' | 'declined'

interface IrisProps {
  readonly state: IrisState
  readonly className?: string
}

export function Iris({ state, className }: IrisProps): React.JSX.Element {
  const maskId = `iris-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg
      className={className === undefined ? 'o-iris' : `o-iris ${className}`}
      data-state={state}
      viewBox="-6 -6 76 76"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-6" y="-6" width="76" height="76">
          <circle cx="32" cy="32" r="28" fill="#fff" />
          <g className="o-cuts">
            <path d={IRIS_CUTS_PATH} fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="butt" />
          </g>
          <circle className="o-dot" cx="32" cy="32" r="4.8" fill="#fff" />
          <circle className="o-hole" cx="32" cy="32" r="12" fill="#000" />
        </mask>
      </defs>
      <rect x="-6" y="-6" width="76" height="76" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
