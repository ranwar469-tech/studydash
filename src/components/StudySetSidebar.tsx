import type { StudySet, StudyMode } from '../types'

interface Props {
  studySet: StudySet
  activeMode: StudyMode
  onModeChange: (mode: StudyMode) => void
  onBack: () => void
  onImportPdf: () => void
}

const modes: { mode: StudyMode; label: string }[] = [
  { mode: 'tutor', label: 'AI Tutor' },
  { mode: 'summary', label: 'Summary' },
  { mode: 'flashcards', label: 'Flashcards' },
  { mode: 'quiz', label: 'Quiz' },
  { mode: 'notes', label: 'Notes' },
]

export default function StudySetSidebar({ studySet, activeMode, onModeChange, onBack, onImportPdf }: Props) {
  const total = studySet.progress.unfamiliar + studySet.progress.learning + studySet.progress.familiar + studySet.progress.mastered
  const pct = Math.round((studySet.progress.mastered / total) * 100)

  return (
    <aside className="relative flex h-screen w-72 shrink-0 flex-col overflow-hidden bg-[#061226] px-4 py-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#071a32_0%,#061226_100%)]" />

      <div className="relative shrink-0 pb-4">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/20 hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div className="rounded-3xl bg-[#0d2038] p-4 text-white shadow-xl shadow-black/20 ring-1 ring-orange-400/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">{studySet.subject}</p>
          <h2 className="mt-2 text-lg font-black leading-tight">{studySet.title}</h2>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-slate-400">Mastery</span>
              <span className="font-black">{pct}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#071527]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <nav className="relative min-h-0 flex-1 space-y-2 overflow-y-auto py-1 pr-1">
        {modes.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`min-h-14 w-full rounded-2xl px-4 text-left font-semibold transition-all ${
              activeMode === mode
                ? 'bg-[#f97316] text-white shadow-xl shadow-orange-950/30'
                : 'bg-[#10243d] text-slate-300 ring-1 ring-white/10 hover:bg-[#163254] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="relative shrink-0 space-y-3 pt-4">
        <button onClick={onImportPdf} className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#f97316] px-4 py-3 text-sm font-bold leading-none text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]">
          <span className="text-base leading-none">+</span>
          <span>Add Documents</span>
        </button>
        <div className="rounded-2xl bg-[#10243d] p-3 text-sm font-semibold text-slate-300 ring-1 ring-orange-400/15">
          {studySet.documentCount} local document{studySet.documentCount > 1 ? 's' : ''}
        </div>
      </div>
    </aside>
  )
}
