'use client'

import { useState } from 'react'
import { Iris } from '@/components/brand/Iris'
import type { Messages } from '@/i18n'

type Decision = 'waiting' | 'approved' | 'declined'

interface ApprovalSceneProps {
  readonly labels: Messages['approval']
}

/** The scene of the yes: an agent's proposal, its proof, and the person's button. Example data, said so. */
export function ApprovalScene({ labels }: ApprovalSceneProps): React.JSX.Element {
  const [decision, setDecision] = useState<Decision>('waiting')
  const decided = decision !== 'waiting'

  return (
    <section className="approval" aria-labelledby="approval-title" data-decision={decision}>
      <header className="approval__head">
        <div className="approval__iris">
          <Iris state={decision} />
        </div>
        <div className="approval__status">
          <p className="approval__waiting">
            {decided ? (decision === 'approved' ? labels.approved : labels.sentBack) : labels.waiting}
            {decided ? null : <span className="muted"> · {labels.waitingFor}</span>}
          </p>
          <p className="approval__step mono">{labels.step}</p>
        </div>
        <span className="badge">{labels.example}</span>
      </header>
      <h2 id="approval-title" className="approval__title">
        {labels.title}
      </h2>
      <p className="approval__agent mono">{labels.agent}</p>
      <p className="approval__message">{labels.message}</p>
      <h3 className="visually-hidden">{labels.proofsLabel}</h3>
      <ul className="approval__proofs">
        {labels.proofs.map((proof) => (
          <li key={proof.label}>
            <span className="approval__check" aria-hidden="true" />
            <span>{proof.label}</span>
            <span className="muted mono small">{proof.detail}</span>
          </li>
        ))}
      </ul>
      <p className="approval__commits mono small muted">{labels.commits}</p>
      <div className="approval__actions">
        {decided ? (
          <>
            <p className="approval__receipt mono small">{labels.receipt}</p>
            <button
              type="button"
              className="button button--small"
              onClick={() => {
                setDecision('waiting')
              }}
            >
              {labels.undo}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="button button--signal"
              onClick={() => {
                setDecision('approved')
              }}
            >
              {labels.approve}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setDecision('declined')
              }}
            >
              {labels.sendBack}
            </button>
          </>
        )}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {decided ? (decision === 'approved' ? labels.approved : labels.sentBack) : ''}
      </p>
    </section>
  )
}
