import { useState } from 'react'
import type { QuizQuestion } from '../types'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
}

const initialQuiz: QuizQuestion[] = [
  { id: '1', question: 'Which is NOT a characteristic of Promises?', options: ['Chainable with .then()', 'Built-in cancellation', 'Represents a single future value', 'Centralized error handling'], correctIndex: 1, explanation: 'ES6 Promises do not have built-in cancellation. This is a key limitation.' },
  { id: '2', question: 'What does flatMap do in Observables?', options: ['Flattens nested arrays', 'Maps each value to an Observable and flattens', 'Filters duplicates', 'Converts Observable to Promise'], correctIndex: 1, explanation: 'flatMap takes each value, maps to a new Observable, then flattens all inner Observables into one stream.' },
  { id: '3', question: 'What problem does switchMap solve?', options: ['Debounces keystrokes', 'Cancels pending requests on new input', 'Caches results', 'Retries failures'], correctIndex: 1, explanation: 'switchMap cancels in-flight requests when a new value arrives, ensuring latest-only results.' },
  { id: '4', question: 'Best pattern for multiple values over time?', options: ['Promises', 'Callbacks', 'Observables', 'async/await'], correctIndex: 2, explanation: 'Observables handle async plus multiple values. Promises and async/await handle single values.' },
  { id: '5', question: 'Why is takeUntil(mouseUp$) used in drag?', options: ['Start listening', 'Stop drag on mouse release', 'Prevent mouseDown', 'Throttle events'], correctIndex: 1, explanation: 'takeUntil completes the stream when mouseUp emits, stopping drag tracking.' },
]

export default function QuizView({ studySetId: _studySetId }: Props) {
  // TODO: Replace with api.quiz.list() + api.quiz.generate()
  const [quiz] = useState<QuizQuestion[]>(initialQuiz)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    // TODO: const result = await api.quiz.generate(studySetId)
    setTimeout(() => setGenerating(false), 2000)
  }

  if (quiz.length === 0 && !generating) {
    return (
      <main className="flex flex-1 flex-col bg-[#071527]" style={{ width: '100%' }}>
        <EmptyState
          title="No quiz available"
          description="Generate a quiz from your study materials to test your knowledge."
          action={{ label: 'Generate Quiz', onClick: handleGenerate }}
        />
      </main>
    )
  }

  if (generating) {
    return (
      <main className="flex-1 bg-[#071527]" style={{ width: '100%' }}>
        <LoadingSpinner label="Generating quiz questions..." />
      </main>
    )
  }

  const question = quiz[qIdx]
  const correct = selected === question.correctIndex

  const submit = () => {
    if (selected === null) return
    setSubmitted(true)
    if (correct) setScore(s => s + 1)
  }

  const next = () => {
    if (qIdx < quiz.length - 1) {
      setQIdx(i => i + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    const pct = Math.round((score / quiz.length) * 100)
    return (
      <main className="flex-1 bg-[#071527] p-8" style={{ width: '100%' }}>
        <div className="w-full max-w-md rounded-[2rem] bg-[#0d2038] p-8 text-center shadow-2xl shadow-black/25 ring-1 ring-orange-400/10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/15">
            <span className="text-3xl font-black text-orange-300">{pct}%</span>
          </div>
          <h2 className="text-3xl font-black text-white">Quiz complete</h2>
          <p className="mt-2 text-base text-slate-400">{score}/{quiz.length} correct</p>
          <button onClick={() => { setQIdx(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false) }}
            className="mt-7 rounded-2xl bg-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]">
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527] p-8" style={{ width: '100%' }}>
      <div className="w-full">
        <div className="mb-5 flex items-center justify-end">
        <button onClick={handleGenerate} disabled={generating} className="rounded-2xl bg-[#10243d] px-5 py-3 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50">
          Regenerate
        </button>
      </div>
      <header className="mb-6 rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="mb-4 flex justify-between text-sm font-bold text-slate-400">
            <span>Question {qIdx + 1} of {quiz.length}</span>
            <span className="text-orange-500">Score: {score}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#071527]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15] transition-all duration-500" style={{ width: `${((qIdx + 1) / quiz.length) * 100}%` }} />
          </div>
        </header>

        <section className="rounded-[2rem] bg-[#0d2038] p-7 shadow-xl shadow-black/10 ring-1 ring-white/10">
          <h3 className="mb-6 text-2xl font-black leading-tight text-white">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              let style = 'border-white/10 bg-[#071527] text-slate-200 hover:border-orange-400/40 hover:bg-[#10243d]'
              if (submitted && i === question.correctIndex) style = 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
              else if (submitted && i === selected && !correct) style = 'border-red-400/40 bg-red-500/10 text-red-200'
              else if (!submitted && i === selected) style = 'border-orange-400 bg-orange-500/10 text-orange-200'
              return (
                <button key={i} onClick={() => !submitted && setSelected(i)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-semibold transition ${style}`}>
                  {opt}
                </button>
              )
            })}
          </div>

          {submitted && (
            <div className={`mt-5 rounded-2xl border p-5 text-sm leading-relaxed ${correct ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
              <p className="mb-1 font-black">{correct ? 'Correct' : 'Incorrect'}</p>
              {question.explanation}
            </div>
          )}
        </section>

        <div className="mt-5 flex justify-end">
          {!submitted
            ? <button onClick={submit} disabled={selected === null} className="rounded-2xl bg-[#f97316] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-40">Submit</button>
            : <button onClick={next} className="rounded-2xl bg-[#10243d] px-7 py-3 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-[#f97316]">{qIdx < quiz.length - 1 ? 'Next' : 'See Results'}</button>
          }
        </div>
      </div>
    </main>
  )
}
