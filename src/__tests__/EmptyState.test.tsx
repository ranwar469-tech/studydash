import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '../components/EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No files yet" description="Upload a document to get started." />)

    expect(screen.getByText('No files yet')).toBeInTheDocument()
    expect(screen.getByText('Upload a document to get started.')).toBeInTheDocument()
  })

  it('renders action button when provided', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No flashcards"
        description="Generate some first"
        action={{ label: 'Generate', onClick }}
      />,
    )

    const btn = screen.getByRole('button', { name: 'Generate' })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()

    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables action button when disabled=true', () => {
    render(
      <EmptyState
        title="No quizzes"
        description="Nothing here"
        action={{ label: 'Create', onClick: vi.fn(), disabled: true }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('does not render a button when no action is provided', () => {
    render(<EmptyState title="Empty" description="Nothing to show" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
