import '@/styles/docs.css'

/** The docs section: its styles load here, not on the rest of the site. Each page renders its own frame (DocsShell). */
export default function DocsLayout({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>
}
