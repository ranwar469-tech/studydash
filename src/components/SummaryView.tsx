import { useState, useEffect } from 'react'
import { fetchSummary, generateSummary } from '../api'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
  selectedDocIds: string[]
}

export default function SummaryView({ studySetId, selectedDocIds }: Props) {
  const [overview, setOverview] = useState('')
  const [sections, setSections] = useState<{ title: string; desc: string }[]>([])
  const [takeaways, setTakeaways] = useState<string[]>([])
  const [hasData, setHasData] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    fetchSummary(studySetId)
      .then(result => {
        setOverview(result.content)
        setSections(result.sections)
        setTakeaways(result.takeaways)
        setHasData(true)
      })
      .catch(() => {})
  }, [studySetId])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const result = await generateSummary(studySetId, selectedDocIds.length > 0 ? selectedDocIds : undefined)
      setOverview(result.content)
      setSections(result.sections)
      setTakeaways(result.takeaways)
      setHasData(true)
    } catch (e: any) {
      setGenError(e.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="flex flex-col h-full w-full overflow-hidden bg-[#071527]">
      <header className="shrink-0 px-8 pt-6">
        <div className="w-full rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Generated brief</p>
              <h2 className="mt-1 text-2xl font-black text-white">Summary</h2>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 rounded-2xl bg-[#10243d] px-5 py-3 text-sm font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-[#163254] disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {genError && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {genError}
          </div>
        )}
        {generating ? (
          <LoadingSpinner label="Generating summary..." />
        ) : !hasData ? (
          <div className="flex h-full items-start justify-center pt-6">
            <EmptyState
              title="No summary yet"
              description="Generate a summary from your uploaded study materials."
              action={{ label: 'Generate Summary', onClick: handleGenerate }}
            />
          </div>
        ) : (
          <>
            <section className="mb-5 rounded-4xl bg-[#10243d] p-7 text-white shadow-xl shadow-black/20 ring-1 ring-white/10">
              <h3 className="text-xl font-black">Overview</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-300">{overview || 'No overview available.'}</p>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-4xl bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10">
                <h3 className="text-lg font-black text-white">Key Takeaways</h3>
                <div className="mt-5 space-y-4">
                  {takeaways.length > 0 ? takeaways.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-black text-orange-300">{i + 1}</span>
                      <p className="text-base leading-relaxed text-slate-300">{t}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No takeaways yet.</p>}
                </div>
              </section>

              <section className="rounded-4xl bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10">
                <h3 className="text-lg font-black text-white">Section Breakdown</h3>
                <div className="mt-5 space-y-5">
                  {sections.length > 0 ? sections.map(s => (
                    <div key={s.title} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-orange-200">{s.title}</h4>
                      <p className="mt-1 text-base leading-relaxed text-slate-400">{s.desc}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No sections available.</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
