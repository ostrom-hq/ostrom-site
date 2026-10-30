#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// coverage: entry point only; main() is covered in test/cli.test.mjs and this file is run end to end there.
import {main} from "../src/cli.mjs"

process.exitCode = main(process.argv.slice(2), {out: console.log, err: console.error, env: process.env})
