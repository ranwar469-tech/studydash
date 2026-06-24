import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
}

const initialSections = [
  { title: 'The Async Landscape', desc: 'Synchronous/asynchronous and single/multiple values. This mental model clarifies where each tool fits.' },
  { title: 'Promise Limitations', desc: 'No built-in cancellation, single-value only, and no native retry/backoff behavior.' },
  { title: 'Reactive Programming', desc: 'Everything is treated as a stream: mouse events, API responses, WebSocket messages, and more.' },
  { title: 'Generators & Async/Await', desc: 'Generators pause and resume execution. Async/await builds on this for synchronous-looking async code.' },
  { title: 'Backpressure', desc: 'Flow control prevents producers from overwhelming consumers in stream processing.' },
]
const initialTakeaways = [
  'Callback hell is solved by Promises with flat chaining',
  'Promises handle single async values; Observables handle streams',
  'Native Promises lack cancellation; Observables provide teardown',
  'async/await makes async code read synchronously',
]
const initialOverview = 'Asynchronous programming is fundamental in JavaScript. This document covers the evolution from callbacks to promises, observables for multi-value streams, and modern async/await approaches.'

export default function SummaryView({ studySetId: _studySetId }: Props) {
  // TODO: Replace with api.summary.generate()
  const [sections] = useState(initialSections)
  const [takeaways] = useState(initialTakeaways)
  const [overview] = useState(initialOverview)
  const [hasData] = useState(true)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    // TODO: const result = await api.summary.generate(studySetId)
    setTimeout(() => setGenerating(false), 2500)
  }

  if (!hasData && !generating) {
    return (
      <main className="flex flex-1 flex-col bg-[#071527]" style={{ width: '100%' }}>
        <EmptyState
          title="No summary yet"
          description="Generate a summary from your uploaded study materials."
          action={{ label: 'Generate Summary', onClick: handleGenerate }}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527]" style={{ width: '100%' }}>
      <div className="w-full px-8 py-8">
        <header className="mb-6 rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Generated brief</p>
              <h2 className="mt-1 text-3xl font-black text-white">Summary</h2>
              <p className="mt-2 text-base text-slate-400">A calmer, high-signal overview of your study materials.</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 rounded-2xl bg-[#10243d] px-5 py-3 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </header>

        {generating ? (
          <LoadingSpinner label="Generating summary..." />
        ) : (
          <>
            <section className="mb-5 rounded-[2rem] bg-[#10243d] p-7 text-white shadow-xl shadow-black/20 ring-1 ring-white/10">
              <h3 className="text-xl font-black">Overview</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-300">{overview}</p>
            </section>

            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10">
                <h3 className="text-lg font-black text-white">Key Takeaways</h3>
                <div className="mt-5 space-y-4">
                  {takeaways.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-black text-orange-300">{i + 1}</span>
                      <p className="text-base leading-relaxed text-slate-300">{t}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10">
                <h3 className="text-lg font-black text-white">Section Breakdown</h3>
                <div className="mt-5 space-y-5">
                  {sections.map(s => (
                    <div key={s.title} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-orange-200">{s.title}</h4>
                      <p className="mt-1 text-base leading-relaxed text-slate-400">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
