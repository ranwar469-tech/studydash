import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../components/Dashboard'

// ── Mock api module so Dashboard doesn't call real endpoints ─
vi.mock('../api', () => ({
  fetchStudySets: vi.fn(),
  deleteStudySet: vi.fn(),
}))

import { fetchStudySets, deleteStudySet } from '../api'

const mockSets = [
  { id: '1', title: 'Biology', subject: 'Science', documentCount: 3,
    progress: { unfamiliar: 2, learning: 1, familiar: 0, mastered: 0 },
    lastStudied: '' },
  { id: '2', title: 'Calculus', subject: 'Math', documentCount: 5,
    progress: { unfamiliar: 0, learning: 3, familiar: 1, mastered: 1 },
    lastStudied: '' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dashboard', () => {
  it('shows loading spinner while fetching', () => {
    vi.mocked(fetchStudySets).mockReturnValue(new Promise(() => {})) // never resolves
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders study sets when loaded', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument()
      expect(screen.getByText('Calculus')).toBeInTheDocument()
    })
  })

  it('shows empty state when no sets exist', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue([])
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/create your first study set/i)).toBeInTheDocument()
    })
  })

  it('shows error message on fetch failure', async () => {
    vi.mocked(fetchStudySets).mockRejectedValue(new Error('Network error'))
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('displays subject filter pills', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument()
      expect(screen.getByText('Science')).toBeInTheDocument()
    })
  })

  it('filters sets when a subject pill is clicked', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Math'))

    // Biology (Science) should disappear, Calculus (Math) should remain
    expect(screen.queryByText('Biology')).not.toBeInTheDocument()
    expect(screen.getByText('Calculus')).toBeInTheDocument()
  })

  it('clears filter when active pill is clicked again', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => screen.getByText('Math'))
    await userEvent.click(screen.getByText('Math'))
    await userEvent.click(screen.getByText('Math'))

    // Both should be visible again
    expect(screen.getByText('Biology')).toBeInTheDocument()
    expect(screen.getByText('Calculus')).toBeInTheDocument()
  })

  it('calls onSelectSet when a study set card is clicked', async () => {
    const onSelect = vi.fn()
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={onSelect} onCreateSet={vi.fn()} />)

    await waitFor(() => screen.getByText('Biology'))
    await userEvent.click(screen.getByText('Biology'))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Biology' }))
  })

  it('calls onCreateSet when "New Set" button is clicked', async () => {
    const onCreate = vi.fn()
    vi.mocked(fetchStudySets).mockResolvedValue([])
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={onCreate} />)

    await waitFor(() => screen.getByText(/create your first study set/i))
    await userEvent.click(screen.getByText('New Set'))

    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('shows summary stats when sets exist', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => screen.getByText('Biology'))
    // Total docs = 3 + 5 = 8, total mastered = 0 + 1 = 1
    expect(screen.getByText('1')).toBeInTheDocument() // mastered count
    expect(screen.getByText('8')).toBeInTheDocument() // document count
  })
})
