interface PageHeadProps {
  readonly eyebrow: string
  readonly title: string
  readonly lead?: string
  readonly children?: React.ReactNode
}

export function PageHead({ eyebrow, title, lead, children }: PageHeadProps): React.JSX.Element {
  return (
    <header className="page-head">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead === undefined ? null : <p className="lead">{lead}</p>}
        {children}
      </div>
    </header>
  )
}
