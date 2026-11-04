// SPDX-License-Identifier: Apache-2.0
import { getMessages } from '@/i18n'
import { getDocsSite } from '@/lib/docs/site'
import { apiData, apiDataFiles } from '@/lib/openapi/html'

// /docs/api-data/<tag>.json and /docs/api-data/schemas.json, written once by the static export: the details of the API
// reference, fetched by a page when the reader opens one of its toggles (ApiDataListener).
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams(): { file: string }[] {
  return apiDataFiles(getDocsSite().api).map((file) => ({ file }))
}

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly file: string }> },
): Promise<Response> {
  const { file } = await params
  const messages = getMessages()
  return Response.json(apiData(getDocsSite().api, file, messages.docs.api, messages.docs.code.copy))
}
