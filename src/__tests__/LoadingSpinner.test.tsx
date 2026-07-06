import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders default label "Loading..."', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom label', () => {
    render(<LoadingSpinner label="Generating flashcards..." />)
    expect(screen.getByText('Generating flashcards...')).toBeInTheDocument()
  })

  it('renders 3 animated bounce dots', () => {
    render(<LoadingSpinner />)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })
})
