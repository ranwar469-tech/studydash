import { useState, useEffect } from 'react'
import type { QuizQuestion } from '../types'
import { fetchQuiz, generateQuiz, submitQuiz } from '../api'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
  selectedDocIds: string[]
}

export default function QuizView({ studySetId, selectedDocIds }: Props) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchQuiz(studySetId)
      .then(data => { if (!cancelled) setQuiz(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [studySetId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const data = await generateQuiz(studySetId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
      setQuiz(data)
      setQIdx(0)
      setSelected(null)
      setSubmitted(false)
      setScore(0)
      setFinished(false)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const submit = () => {
    if (selected === null) return
    setSubmitted(true)
    if (selected === question.correctIndex) setScore(s => s + 1)
  }

  const next = () => {
    if (qIdx < quiz.length - 1) {
      setQIdx(i => i + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      setFinished(true)
      submitQuiz(studySetId, quiz.map((q, i) => ({
        question_id: q.id,
        selected_index: i === qIdx ? selected! : 0,
      }))).catch(() => {})
    }
  }

  if (loading) return <main className="h-full w-full bg-[#071527]"><LoadingSpinner /></main>

  if (quiz.length === 0 && !generating) {
    return (
      <main className="flex flex-col h-full w-full bg-[#071527]">
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
      <main className="flex h-full w-full items-center justify-center bg-[#071527]">
        <LoadingSpinner label="Generating quiz questions..." />
      </main>
    )
  }

  const question = quiz[qIdx]
  if (!question) return null

  if (finished) {
    const pct = Math.round((score / quiz.length) * 100)
    return (
      <main className="flex h-full w-full items-center justify-center bg-[#071527] p-8">
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
    <main className="h-full w-full overflow-y-auto bg-[#071527] p-8">
      <header className="mb-6 rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Quiz</p>
            <h2 className="mt-1 text-2xl font-black text-white">Question {qIdx + 1} of {quiz.length}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-orange-400">Score: {score}</span>
            <button onClick={handleGenerate} disabled={generating} className="rounded-2xl bg-[#10243d] px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50">
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </header>
      <div className="w-full">
        <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-[#071527]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15] transition-all duration-500" style={{ width: `${((qIdx + 1) / quiz.length) * 100}%` }} />
        </div>

        <section className="rounded-[2rem] bg-[#0d2038] p-7 shadow-xl shadow-black/10 ring-1 ring-white/10">
          <h3 className="mb-6 text-2xl font-black leading-tight text-white">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              let style = 'border-white/10 bg-[#071527] text-slate-200 hover:border-orange-400/40 hover:bg-[#10243d]'
              if (submitted && i === question.correctIndex) style = 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
              else if (submitted && i === selected && selected !== question.correctIndex) style = 'border-red-400/40 bg-red-500/10 text-red-200'
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
            <div className={`mt-5 rounded-2xl border p-5 text-sm leading-relaxed ${selected === question.correctIndex ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
              <p className="mb-1 font-black">{selected === question.correctIndex ? 'Correct' : 'Incorrect'}</p>
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
