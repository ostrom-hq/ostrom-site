import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { en } from '@/i18n/en'
import { ApprovalScene } from './ApprovalScene'

const labels = en.approval

describe('ApprovalScene', () => {
  it('shows the proposal, its proof and the person’s buttons, marked as an example', () => {
    render(<ApprovalScene labels={labels} />)
    expect(screen.getByRole('heading', { name: labels.title })).toBeInTheDocument()
    expect(screen.getByText(labels.example)).toBeInTheDocument()
    for (const proof of labels.proofs) expect(screen.getByText(proof.label)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: labels.approve })).toBeInTheDocument()
    expect(screen.getByText(labels.waiting, { exact: false })).toBeInTheDocument()
  })

  it('opens the diaphragm on a yes, puts it on the receipt, and can undo', async () => {
    const user = userEvent.setup()
    const { container } = render(<ApprovalScene labels={labels} />)
    await user.click(screen.getByRole('button', { name: labels.approve }))
    expect(screen.getByRole('status')).toHaveTextContent(labels.approved)
    expect(screen.getByText(labels.receipt)).toBeInTheDocument()
    expect(container.querySelector('.o-iris')).toHaveAttribute('data-state', 'approved')
    await user.click(screen.getByRole('button', { name: labels.undo }))
    expect(container.querySelector('.o-iris')).toHaveAttribute('data-state', 'waiting')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('closes it when the person sends the change back', async () => {
    const user = userEvent.setup()
    const { container } = render(<ApprovalScene labels={labels} />)
    await user.click(screen.getByRole('button', { name: labels.sendBack }))
    expect(screen.getByRole('status')).toHaveTextContent(labels.sentBack)
    expect(container.querySelector('.o-iris')).toHaveAttribute('data-state', 'declined')
  })
})
