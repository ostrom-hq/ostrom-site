// SPDX-License-Identifier: Apache-2.0
import { render } from '@testing-library/react'
import { RuntimeReady } from './RuntimeReady'

it('marks the page once React runs it', () => {
  delete document.documentElement.dataset['runtime']
  const { container } = render(<RuntimeReady />)
  expect(container).toBeEmptyDOMElement()
  expect(document.documentElement.dataset['runtime']).toBe('ready')
})
