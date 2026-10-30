// SPDX-License-Identifier: Apache-2.0
// The public build-time variables, declared so they read as `process.env.NAME` (the form Next.js inlines).
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SITE_URL?: string
    readonly NEXT_PUBLIC_APP_URL?: string
    readonly NEXT_PUBLIC_API_URL?: string
    readonly NEXT_PUBLIC_LAUNCHED?: string
  }
}
