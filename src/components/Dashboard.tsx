import { useState } from 'react'
import type { StudySet } from '../types'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

const initialSets: StudySet[] = [
  { id: '1', title: 'Data Structures & Algorithms', subject: 'Computer Science', progress: { unfamiliar: 12, learning: 8, familiar: 15, mastered: 45 }, documentCount: 3, lastStudied: '2 hours ago' },
  { id: '2', title: 'Linear Algebra', subject: 'Mathematics', progress: { unfamiliar: 25, learning: 10, familiar: 5, mastered: 10 }, documentCount: 2, lastStudied: 'Yesterday' },
  { id: '3', title: 'Machine Learning Basics', subject: 'Computer Science', progress: { unfamiliar: 30, learning: 12, familiar: 8, mastered: 20 }, documentCount: 5, lastStudied: '3 days ago' },
  { id: '4', title: 'Organic Chemistry', subject: 'Chemistry', progress: { unfamiliar: 33, learning: 2, familiar: 2, mastered: 29 }, documentCount: 4, lastStudied: '1 week ago' },
  { id: '5', title: 'Async JavaScript Pitfalls', subject: 'Computer Science', progress: { unfamiliar: 40, learning: 5, familiar: 3, mastered: 2 }, documentCount: 1, lastStudied: 'Just now' },
]

interface Props {
  onSelectSet: (set: StudySet) => void
  onCreateSet: () => void
}

export default function Dashboard({ onSelectSet, onCreateSet }: Props) {
  // TODO: Replace with api.studySets.list() + loading/error states
  const [studySets] = useState<StudySet[]>(initialSets)
  const [loading] = useState(false)
  const [error] = useState('')

  const totalMastered = studySets.reduce((s, set) => s + set.progress.mastered, 0)
  const totalCards = studySets.reduce((s, set) =>
    s + set.progress.unfamiliar + set.progress.learning + set.progress.familiar + set.progress.mastered, 0
  )

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527]">
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-8 flex flex-col gap-5 rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Local library</p>
            <h1 className="text-4xl font-black text-white">Study Sets</h1>
            <p className="mt-2 text-base text-slate-400">Your PDFs, notes, and progress stay stored on this device.</p>
          </div>
          <button onClick={onCreateSet} className="flex items-center justify-center gap-2 rounded-2xl bg-[#10243d] px-5 py-4 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#163254] hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Set
          </button>
        </header>

        {loading ? (
          <LoadingSpinner label="Loading study sets..." />
        ) : error ? (
          <div className="rounded-[2rem] bg-red-500/10 border border-red-500/20 p-6 text-center">
            <p className="text-sm font-semibold text-red-300">{error}</p>
          </div>
        ) : studySets.length === 0 ? (
          <EmptyState
            title="No study sets yet"
            description="Click 'New Set' above to create your first study set, then upload PDFs inside it."
          />
        ) : (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Saved sets', value: studySets.length },
                { label: 'Local cards', value: totalCards },
                { label: 'Mastered', value: totalMastered },
              ].map(stat => (
                <div key={stat.label} className="rounded-3xl bg-[#0d2038] p-5 shadow-xl shadow-black/10 ring-1 ring-white/10">
                  <p className="text-sm font-semibold text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {studySets.map((set) => {
                const total = set.progress.unfamiliar + set.progress.learning + set.progress.familiar + set.progress.mastered
                const pct = Math.round((set.progress.mastered / total) * 100)
                return (
                  <div
                    key={set.id}
                    onClick={() => onSelectSet(set)}
                    className="group cursor-pointer rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10 transition-all hover:-translate-y-1 hover:ring-orange-400/35 hover:shadow-2xl hover:shadow-black/20"
                  >
                    <div className="mb-7 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-orange-500">{set.subject}</p>
                        <h3 className="mt-1 truncate text-2xl font-black text-white">{set.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-2xl bg-[#132a49] px-4 py-2 text-sm font-bold text-orange-200">{set.documentCount} docs</span>
                    </div>

                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-400">Mastery</span>
                        <span className="text-sm font-black text-white">{pct}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#071527]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15] transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                      <p className="text-sm font-medium text-slate-400">Last studied {set.lastStudied}</p>
                      <span className="rounded-2xl bg-[#f97316] px-4 py-2 text-sm font-bold text-white transition group-hover:bg-[#fb923c]">Open</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
