import { useState } from 'react'
import type { Flashcard } from '../types'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
}

const initialCards: Flashcard[] = [
  { id: '1', question: 'What is a Promise in JavaScript?', answer: 'An object representing the eventual completion or failure of an async operation. Chainable with .then(), catch errors with .catch().' },
  { id: '2', question: 'What is callback hell?', answer: 'Nested callbacks multiple levels deep, making code difficult to read and maintain. Solved by Promises.' },
  { id: '3', question: 'How does async/await work?', answer: 'Syntactic sugar over Promises. await pauses until Promise resolves. try/catch handles errors naturally.' },
  { id: '4', question: 'What is an Observable?', answer: 'A stream of values emitted over time. Unlike Promises, Observables emit multiple values asynchronously.' },
  { id: '5', question: 'What is backpressure?', answer: 'Flow control preventing producers from overwhelming consumers. Allows consumers to signal readiness for more data.' },
]

export default function FlashcardView({ studySetId: _studySetId }: Props) {
  // TODO: Replace with api.flashcards.list() + api.flashcards.generate()
  const [cards] = useState<Flashcard[]>(initialCards)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    // TODO: const result = await api.flashcards.generate(studySetId)
    setTimeout(() => setGenerating(false), 2000)
  }

  const next = () => { setFlipped(false); setIdx(i => (i + 1) % cards.length) }
  const prev = () => { setFlipped(false); setIdx(i => (i - 1 + cards.length) % cards.length) }
  const card = cards[idx]

  if (cards.length === 0 && !generating) {
    return (
      <main className="flex flex-1 flex-col overflow-y-auto bg-[#071527]" style={{ width: '100%' }}>
        <EmptyState
          title="No flashcards yet"
          description="Generate flashcards from your study materials using AI."
          action={{ label: 'Generate Flashcards', onClick: handleGenerate }}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col bg-[#071527]">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-5xl flex flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Flashcards</p>
              <h2 className="mt-1 text-3xl font-black text-white">Card {idx + 1} of {cards.length}</h2>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-2xl bg-[#10243d] px-5 py-3 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>

          {generating ? (
            <LoadingSpinner label="Generating flashcards..." />
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {cards.map((_, i) => (
                  <div key={i} className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-10 bg-[#f97316]' : 'w-2.5 bg-[#243957]'}`} />
                ))}
              </div>

              <div className="w-full max-w-3xl perspective" style={{ minHeight: '380px' }}>
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
      </div>
    </main>
  )
}
