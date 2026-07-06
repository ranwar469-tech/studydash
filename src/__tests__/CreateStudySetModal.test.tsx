import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateStudySetModal from '../components/CreateStudySetModal'

describe('CreateStudySetModal', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(
      <CreateStudySetModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders form when open=true', () => {
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('New Study Set')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Data Structures/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Computer Science/)).toBeInTheDocument()
  })

  it('has submit button disabled when title is empty', () => {
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /create study set/i })).toBeDisabled()
  })

  it('enables submit button when title has text', async () => {
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    const input = screen.getByPlaceholderText(/Data Structures/)
    await userEvent.type(input, 'Algorithms')
    expect(screen.getByRole('button', { name: /create study set/i })).toBeEnabled()
  })

  it('remains disabled when title is only whitespace', async () => {
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    const input = screen.getByPlaceholderText(/Data Structures/)
    await userEvent.type(input, '   ')
    expect(screen.getByRole('button', { name: /create study set/i })).toBeDisabled()
  })

  it('calls onSubmit with trimmed values and closes', async () => {
    const onSubmit = vi.fn()
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByPlaceholderText(/Data Structures/), '  Algorithms  ')
    await userEvent.type(screen.getByPlaceholderText(/Computer Science/), '  CS  ')
    await userEvent.click(screen.getByRole('button', { name: /create study set/i }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Algorithms', subject: 'CS' })
  })

  it('defaults subject to "General" when empty', async () => {
    const onSubmit = vi.fn()
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByPlaceholderText(/Data Structures/), 'Networks')
    await userEvent.click(screen.getByRole('button', { name: /create study set/i }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Networks', subject: 'General' })
  })

  it('calls onClose when close X button is clicked', async () => {
    const onClose = vi.fn()
    render(<CreateStudySetModal open onClose={onClose} onSubmit={vi.fn()} />)

    // The X button is the first button (before the form)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0]) // X close button
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<CreateStudySetModal open onClose={onClose} onSubmit={vi.fn()} />)

    // Backdrop is the div with backdrop-blur-sm, which is the first child of the overlay
    const backdrop = document.querySelector('.backdrop-blur-sm')!
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('submits on Enter key', async () => {
    const onSubmit = vi.fn()
    render(<CreateStudySetModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText(/Data Structures/)
    await userEvent.type(input, 'DBMS')
    await userEvent.keyboard('{Enter}')

    expect(onSubmit).toHaveBeenCalledWith({ title: 'DBMS', subject: 'General' })
  })

  it('clears inputs after successful submit', async () => {
    const onSubmit = vi.fn()
    const { rerender } = render(
      <CreateStudySetModal open onClose={vi.fn()} onSubmit={onSubmit} />,
    )

    await userEvent.type(screen.getByPlaceholderText(/Data Structures/), 'OS')
    await userEvent.click(screen.getByRole('button', { name: /create study set/i }))

    // Re-render (simulating parent state change)
    rerender(<CreateStudySetModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />)
    rerender(<CreateStudySetModal open onClose={vi.fn()} onSubmit={vi.fn()} />)

    // Inputs should be empty again
    expect(screen.getByPlaceholderText(/Data Structures/)).toHaveValue('')
    expect(screen.getByPlaceholderText(/Computer Science/)).toHaveValue('')
  })
})
