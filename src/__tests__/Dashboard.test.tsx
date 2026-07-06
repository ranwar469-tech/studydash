import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../components/Dashboard'

// ── Mock api module so Dashboard doesn't call real endpoints ─
vi.mock('../api', () => ({
  fetchStudySets: vi.fn(),
  deleteStudySet: vi.fn(),
}))

import { fetchStudySets } from '../api'

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
      expect(screen.getByText('Biology')).toBeInTheDocument()
    })
    // Filter pills appear as buttons — use getAllByText since subject names
    // also appear on cards, causing getByText to throw on multiple matches
    expect(screen.getAllByText('Math').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Science').length).toBeGreaterThanOrEqual(1)
  })

  it('filters sets when a subject pill is clicked', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument()
      expect(screen.getByText('Calculus')).toBeInTheDocument()
    })

    // Click the "Math" filter pill
    await userEvent.click(screen.getByRole('button', { name: 'Math' }))

    // Biology (Science) should disappear, Calculus (Math) should remain
    expect(screen.queryByText('Biology')).not.toBeInTheDocument()
    expect(screen.getByText('Calculus')).toBeInTheDocument()
  })

  it('clears filter when active pill is clicked again', async () => {
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={vi.fn()} onCreateSet={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeInTheDocument()
      expect(screen.getByText('Calculus')).toBeInTheDocument()
    })

    const mathBtn = screen.getByRole('button', { name: 'Math' })
    await userEvent.click(mathBtn)
    await userEvent.click(mathBtn)

    // Both should be visible again
    expect(screen.getByText('Biology')).toBeInTheDocument()
    expect(screen.getByText('Calculus')).toBeInTheDocument()
  })

  it('calls onSelectSet when a study set card is clicked', async () => {
    const onSelect = vi.fn()
    vi.mocked(fetchStudySets).mockResolvedValue(mockSets)
    render(<Dashboard onSelectSet={onSelect} onCreateSet={vi.fn()} />)

    await waitFor(() => screen.getByText('Biology'))
    // Click the study set title (h3 inside the card)
    await userEvent.click(screen.getByRole('heading', { name: 'Biology' }))

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
    // The stats section shows "2" for saved sets, "8" for documents
    expect(screen.getByText('2')).toBeInTheDocument()  // saved sets count
    expect(screen.getByText('8')).toBeInTheDocument()  // total documents
  })
})
