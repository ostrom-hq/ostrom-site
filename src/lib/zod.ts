// SPDX-License-Identifier: Apache-2.0
// Zod for the whole site, without its compiled parsers: to know whether it may compile them, Zod tries `new Function`,
// which the Content-Security-Policy forbids (no 'unsafe-eval') and the browser reports as a violation. Every module
// imports `z` from here, never from 'zod'.
import { z } from 'zod'

z.config({ jitless: true })

export { z }
