import { codeBlockHtml } from '@/lib/docs/code'
import { fill } from '@/lib/docs/text'
import type { ApiOperation, ApiResponse } from '@/lib/openapi/reference'
import { InlineText, splitSummary } from './InlineText'
import { FieldHead, SchemaDetails, TypeText, type ApiLabels } from './SchemaView'

/** The HTTP method, coloured by what it does (read, create, change, delete). */
export function MethodBadge({ method }: { readonly method: string }): React.JSX.Element {
  return <span className={`api-method api-method--${method}`}>{method.toUpperCase()}</span>
}

function ResponseItem({
  response,
  labels,
}: {
  readonly response: ApiResponse
  readonly labels: ApiLabels
}): React.JSX.Element {
  const head = (
    <>
      <span className={`api-status api-status--${response.status.charAt(0)}xx`}>{response.status}</span>
      {response.description === null ? null : (
        <span className="api-response__description">
          <InlineText text={response.description} />
        </span>
      )}
    </>
  )
  if (response.schema === null) return <li className="api-response">{head}</li>
  // The summary stays plain text (no link inside the toggle); the linked type is the first line of the details.
  return (
    <li className="api-response">
      <details>
        <summary>{head}</summary>
        <p className="api-field__head">
          <span className="api-field__type">
            <TypeText node={response.schema} />
          </span>
        </p>
        <SchemaDetails node={{ ...response.schema, description: null }} labels={labels} folded={false} />
      </details>
    </li>
  )
}

/** One endpoint: what it does and takes on the left, a curl to copy and the response it returns on the right. */
export function OperationView({
  operation,
  labels,
  copyLabel,
}: {
  readonly operation: ApiOperation
  readonly labels: ApiLabels
  readonly copyLabel: string
}): React.JSX.Element {
  const { title, rest } = splitSummary(operation.summary)
  return (
    <section className="api-op" aria-labelledby={operation.anchor}>
      <h2 id={operation.anchor}>
        <a href={`#${operation.anchor}`}>{title}</a>
      </h2>
      <p className="api-op__route">
        <MethodBadge method={operation.method} />
        <code className="api-op__path">{operation.path}</code>
        {operation.authenticated ? null : <span className="badge">{labels.public}</span>}
        {operation.deprecated ? <span className="badge badge--warning">{labels.deprecated}</span> : null}
      </p>
      <div className="api-op__grid">
        <div className="api-op__doc">
          {[rest, operation.description].map((paragraph, position) =>
            paragraph === null ? null : (
              <p key={position}>
                <InlineText text={paragraph} />
              </p>
            ),
          )}
          {operation.parameters.length === 0 ? null : (
            <>
              <h3>{labels.parameters}</h3>
              <ul className="api-fields">
                {operation.parameters.map((parameter) => (
                  <li key={`${parameter.location}:${parameter.name}`} className="api-field">
                    <FieldHead
                      name={parameter.name}
                      node={parameter.schema}
                      required={parameter.required}
                      deprecated={parameter.deprecated}
                      labels={labels}
                      location={parameter.location}
                    />
                    {parameter.description === null ? null : (
                      <p className="api-field__description">
                        <InlineText text={parameter.description} />
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {operation.body === null ? null : (
            <>
              <h3>{labels.body}</h3>
              <p className="api-field__meta">
                <code>{operation.body.contentType}</code>
                {operation.body.required ? (
                  <span className="api-field__flag api-field__flag--required">{labels.required}</span>
                ) : null}
              </p>
              {operation.body.description === null ? null : (
                <p>
                  <InlineText text={operation.body.description} />
                </p>
              )}
              {operation.body.schema === null ? null : (
                <SchemaDetails node={operation.body.schema} labels={labels} folded={false} />
              )}
            </>
          )}
          <h3>{labels.responses}</h3>
          <ul className="api-responses">
            {operation.responses.map((response) => (
              <ResponseItem key={response.status} response={response} labels={labels} />
            ))}
          </ul>
        </div>
        <div className="api-op__examples">
          <div
            dangerouslySetInnerHTML={{
              __html: codeBlockHtml(operation.curl, {
                language: 'shellscript',
                meta: null,
                copyLabel,
                title: labels.request,
              }),
            }}
          />
          {operation.responseExample === null ? null : (
            <div
              dangerouslySetInnerHTML={{
                __html: codeBlockHtml(operation.responseExample.json, {
                  language: 'json',
                  meta: null,
                  copyLabel,
                  title: fill(labels.response, { status: operation.responseExample.status }),
                }),
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
