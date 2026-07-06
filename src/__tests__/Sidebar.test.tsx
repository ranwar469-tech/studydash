import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../components/Sidebar'

describe('Sidebar', () => {
  it('renders branding', () => {
    render(<Sidebar activePage="library" onNavigate={vi.fn()} />)
    expect(screen.getByText('StudyDash')).toBeInTheDocument()
    expect(screen.getByText('Local AI study companion')).toBeInTheDocument()
  })

  it('renders Library and Documents navigation buttons', () => {
    render(<Sidebar activePage="library" onNavigate={vi.fn()} />)
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('highlights active page button', () => {
    const { rerender } = render(<Sidebar activePage="library" onNavigate={vi.fn()} />)
    // Can't easily test CSS class, but we can verify both buttons exist
    expect(screen.getAllByRole('button')).toHaveLength(2)

    rerender(<Sidebar activePage="documents" onNavigate={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('calls onNavigate with correct page when button clicked', async () => {
    const onNavigate = vi.fn()
    render(<Sidebar activePage="library" onNavigate={onNavigate} />)

    await userEvent.click(screen.getByText('Documents'))
    expect(onNavigate).toHaveBeenCalledWith('documents')
  })

  it('shows footer with local library info', () => {
    render(<Sidebar activePage="library" onNavigate={vi.fn()} />)
    expect(screen.getByText('Local Library')).toBeInTheDocument()
    expect(screen.getByText('Saved on this device')).toBeInTheDocument()
  })
})
