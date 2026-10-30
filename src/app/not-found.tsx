// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import { getMessages } from '@/i18n'

export default function NotFound(): React.JSX.Element {
  const { notFound } = getMessages()
  return (
    <section className="container page-head">
      <p className="eyebrow">404</p>
      <h1>{notFound.title}</h1>
      <p className="lead">{notFound.body}</p>
      <div className="row">
        <Link className="button button--signal" href="/">
          {notFound.home}
        </Link>
      </div>
    </section>
  )
}
