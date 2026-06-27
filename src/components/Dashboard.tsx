import { useState, useEffect, useCallback } from 'react'
import type { StudySet } from '../types'
import { fetchStudySets, deleteStudySet } from '../api'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  onSelectSet: (set: StudySet) => void
  onCreateSet: () => void
}

export default function Dashboard({ onSelectSet, onCreateSet }: Props) {
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetchStudySets()
      .then(data => setStudySets(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this study set and all its data?')) return
    try {
      await deleteStudySet(id)
      load()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    }
  }

  const totalMastered = studySets.reduce((s, set) => s + set.progress.mastered, 0)
  const totalDocs = studySets.reduce((s, set) => s + set.documentCount, 0)

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
                { label: 'Documents', value: totalDocs },
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
                const pct = total > 0 ? Math.round((set.progress.mastered / total) * 100) : 0
                return (
                  <div
                    key={set.id}
                    onClick={() => onSelectSet(set)}
                    className="group cursor-pointer rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10 transition-all hover:-translate-y-1 hover:ring-orange-400/35 hover:shadow-2xl hover:shadow-black/20 relative"
                  >
                    <button
                      onClick={(e) => handleDelete(e, set.id)}
                      className="absolute right-4 top-4 z-10 rounded-xl p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                      title="Delete study set"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <div className="mb-5 flex items-start justify-between gap-4 pt-1">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-orange-500">{set.subject}</p>
                        <h3 className="mt-1 truncate text-2xl font-black text-white">{set.title}</h3>
                      </div>
                    </div>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-2xl bg-[#132a49] px-4 py-1.5 text-xs font-bold text-orange-200">{set.documentCount} docs</span>
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
                      <p className="text-sm font-medium text-slate-400">{set.lastStudied || 'Not studied yet'}</p>
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
