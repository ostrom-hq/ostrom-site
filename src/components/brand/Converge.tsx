import { useId } from 'react'
import { IRIS_CUTS_PATH } from './geometry'

/** « Many agents. One way out. »: named threads converge into the diaphragm, one signed change ships. */
interface ConvergeProps {
  readonly label: string
  readonly agents: readonly [string, string, string, string]
  readonly gate: string
  readonly shipped: readonly [string, string]
}

const THREAD_Y = [34, 88, 152, 206] as const

export function Converge({ label, agents, gate, shipped }: ConvergeProps): React.JSX.Element {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg className="o-converge" viewBox="0 0 800 260" role="img" aria-label={label}>
      <defs>
        {THREAD_Y.map((_, index) => (
          <clipPath key={index} id={`${id}-c${String(index)}`}>
            <rect
              className={`o-clip o-c${String(index + 1)}`}
              x="170"
              y="0"
              width="268"
              height="240"
            />
          </clipPath>
        ))}
        <clipPath id={`${id}-x`}>
          <rect className="o-exitclip" x="508" y="108" width="194" height="24" />
        </clipPath>
      </defs>
      <g className="o-cv-all">
        <g className="o-labs">
          {[
            [THREAD_Y[0], agents[0]] as const,
            [THREAD_Y[1], agents[1]] as const,
            [THREAD_Y[2], agents[2]] as const,
            [THREAD_Y[3], agents[3]] as const,
          ].map(([y, agent]) => (
            <text key={y} className="o-lab" x="164" y={y + 4} textAnchor="end">
              {agent}
            </text>
          ))}
        </g>
        {THREAD_Y.map((y, index) => (
          <path
            key={y}
            className="o-thread"
            clipPath={`url(#${id}-c${String(index)})`}
            d={`M178 ${String(y)}C330 ${String(y)} 360 120 432 120`}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        <svg className="o-iris" x="421.1" y="71.1" width="97.7" height="97.7" viewBox="-6 -6 76 76">
          <defs>
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="-6" y="-6" width="76" height="76">
              <circle cx="32" cy="32" r="28" fill="#fff" />
              <g className="o-cuts">
                <path d={IRIS_CUTS_PATH} fill="none" stroke="#000" strokeWidth="2.6" />
              </g>
              <circle className="o-dot" cx="32" cy="32" r="4.8" fill="#fff" />
              <circle className="o-hole" cx="32" cy="32" r="12" fill="#000" />
            </mask>
          </defs>
          <rect x="-6" y="-6" width="76" height="76" fill="currentColor" mask={`url(#${id}-m)`} />
        </svg>
        <text className="o-lab" x="470" y="186" textAnchor="middle">
          {gate}
        </text>
        <line
          className="o-out"
          clipPath={`url(#${id}-x)`}
          x1="514"
          y1="120"
          x2="690"
          y2="120"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle className="o-bead o-sig" cx="514" cy="120" r="8" />
        <g className="o-done">
          <text className="o-sigt" x="704" y="125">
            {shipped[0]}
          </text>
          <text className="o-sigt" x="704" y="143">
            {shipped[1]}
          </text>
        </g>
      </g>
    </svg>
  )
}
