import { useState, useEffect } from 'react'
import type { Flashcard } from '../types'
import { fetchFlashcards, generateFlashcards } from '../api'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
  selectedDocIds: string[]
}

export default function FlashcardView({ studySetId, selectedDocIds }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchFlashcards(studySetId)
      .then(data => { if (!cancelled) setCards(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [studySetId])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const data = await generateFlashcards(studySetId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
      setCards(data)
      setIdx(0)
      setFlipped(false)
    } catch (e: any) {
      setGenError(e.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const next = () => { setFlipped(false); setIdx(i => (i + 1) % cards.length) }
  const prev = () => { setFlipped(false); setIdx(i => (i - 1 + cards.length) % cards.length) }

  if (loading) return <main className="h-full w-full bg-[#071527]"><LoadingSpinner /></main>

  if (cards.length === 0 && !generating) {
    return (
      <main className="flex flex-col h-full w-full bg-[#071527]">
        <EmptyState
          title="No flashcards yet"
          description="Generate flashcards from your study materials using AI."
          action={{ label: 'Generate Flashcards', onClick: handleGenerate }}
        />
      </main>
    )
  }

  const card = cards[idx]

  return (
    <main className="flex flex-col h-full w-full overflow-hidden bg-[#071527]">
      <header className="shrink-0 px-8 pt-6">
        <div className="rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex w-full items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Flashcards</p>
              <h2 className="mt-1 text-2xl font-black text-white">Card {idx + 1} of {cards.length}</h2>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 rounded-2xl bg-[#10243d] px-5 py-2.5 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
          {genError && (
            <div className="mb-4 w-full max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {genError}
            </div>
          )}
          {generating ? (
            <LoadingSpinner label="Generating flashcards..." />
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {cards.map((_, i) => (
                  <div key={i} className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-10 bg-[#f97316]' : 'w-2.5 bg-[#243957]'}`} />
                ))}
              </div>

              <div className="w-full max-w-3xl perspective mx-auto" style={{ minHeight: '380px' }}>
                <div className={`card-inner relative w-full cursor-pointer ${flipped ? 'card-flipped' : ''}`}
                  style={{ minHeight: '380px' }}
                  onClick={() => setFlipped(!flipped)}>
                  <div className="card-front absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] bg-[#0d2038] p-10 text-center shadow-2xl shadow-black/25 ring-1 ring-orange-400/10">
                    <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-orange-500">Question</p>
                    <p className="max-w-xl text-3xl font-black leading-tight text-white">{card.question}</p>
                    <p className="mt-8 text-sm font-semibold text-slate-400">Click to reveal</p>
                  </div>
                  <div className="card-back absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] bg-[#10243d] p-10 text-center text-white shadow-2xl shadow-black/25 ring-1 ring-orange-400/20">
                    <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-teal-300">Answer</p>
                    <p className="max-w-xl text-xl leading-relaxed text-slate-100">{card.answer}</p>
                    {card.explanation && (
                      <p className="mt-4 text-sm text-slate-400 max-w-lg">{card.explanation}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button onClick={prev} className="rounded-2xl bg-[#10243d] px-6 py-3 text-sm font-bold text-slate-200 shadow-sm ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#163254]">Previous</button>
                <button onClick={next} className="rounded-2xl bg-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#fb923c]">Next</button>
              </div>
            </>
          )}
        </div>
    </main>
  )
}
