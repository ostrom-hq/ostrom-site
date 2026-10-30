import { render } from '@testing-library/react'
import { Converge } from './Converge'
import { Iris } from './Iris'
import { Logo } from './Logo'
import { WORDMARK_PATHS } from './geometry'

describe('Logo', () => {
  it('draws the symbol and the wordmark, hidden from assistive tech', () => {
    const { container } = render(<Logo className="x" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('x')
    expect(container.querySelectorAll('path')).toHaveLength(1 + WORDMARK_PATHS.length)
  })

  it('can draw the symbol alone', () => {
    const { container } = render(<Logo symbolOnly />)
    expect(container.querySelectorAll('path')).toHaveLength(1)
  })
})

describe('Iris', () => {
  it('carries its state for the CSS transition, with a unique mask', () => {
    const { container } = render(
      <>
        <Iris state="waiting" />
        <Iris state="approved" className="big" />
      </>,
    )
    const irises = container.querySelectorAll('svg.o-iris')
    expect(irises[0]).toHaveAttribute('data-state', 'waiting')
    expect(irises[1]).toHaveAttribute('data-state', 'approved')
    expect(irises[1]).toHaveClass('big')
    const masks = [...container.querySelectorAll('mask')].map((mask) => mask.id)
    expect(new Set(masks).size).toBe(2)
  })
})

describe('Converge', () => {
  it('names the four agents, the gate and the signed exit', () => {
    const { getByRole, getByText } = render(
      <Converge label="Many agents. One way out." agents={['A', 'B', 'C', 'D']} gate="gate" shipped={['shipped,', 'signed']} />,
    )
    expect(getByRole('img', { name: 'Many agents. One way out.' })).toBeInTheDocument()
    for (const text of ['A', 'B', 'C', 'D', 'gate', 'shipped,', 'signed']) {
      expect(getByText(text)).toBeInTheDocument()
    }
  })
})
