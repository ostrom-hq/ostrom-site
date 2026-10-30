// SPDX-License-Identifier: Apache-2.0
import { z } from './zod'

it('parses without compiling code, so the policy never sees an eval', () => {
  expect(z.config().jitless).toBe(true)
  expect(z.object({ a: z.string() }).parse({ a: 'x' })).toEqual({ a: 'x' })
})
