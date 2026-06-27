import type { StudySet, StudyMode } from '../types'

interface Props {
  studySet: StudySet
  activeMode: StudyMode
  onModeChange: (mode: StudyMode) => void
  onBack: () => void
  onImportPdf: () => void
  docCount: number
}

const modes: { mode: StudyMode; label: string }[] = [
  { mode: 'tutor', label: 'AI Tutor' },
  { mode: 'summary', label: 'Summary' },
  { mode: 'flashcards', label: 'Flashcards' },
  { mode: 'quiz', label: 'Quiz' },
  { mode: 'notes', label: 'Notes' },
]

export default function StudySetSidebar({ studySet, activeMode, onModeChange, onBack, onImportPdf, docCount }: Props) {
  const total = studySet.progress.unfamiliar + studySet.progress.learning + studySet.progress.familiar + studySet.progress.mastered
  const pct = total > 0 ? Math.round((studySet.progress.mastered / total) * 100) : 0

  return (
    <aside className="relative flex h-full w-80 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[#061226] px-4 py-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_38%),linear-gradient(180deg,#071a32_0%,#061226_100%)]" />

      <div className="relative flex shrink-0 flex-col gap-4 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f97316] shadow-xl shadow-orange-950/40 ring-4 ring-orange-400/15">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black leading-none tracking-tight text-white">StudyDash</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-200/90">Local AI study companion</p>
          </div>
        </div>

        <button onClick={onBack} className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/10 px-3.5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/20 hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div className="rounded-3xl bg-[#0d2038] p-4 shadow-xl shadow-black/20 ring-1 ring-orange-400/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">{studySet.subject}</p>
          <h2 className="mt-1 text-lg font-black leading-tight text-white">{studySet.title}</h2>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 rounded-xl bg-[#071527] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Docs</p>
              <p className="text-base font-black text-white">{docCount}</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#071527] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Mastery</p>
              <p className="text-base font-black text-white">{pct}%</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#071527]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 space-y-2 overflow-y-auto pb-5">
        {modes.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-all ${
              activeMode === mode
                ? 'bg-[#f97316] text-white shadow-xl shadow-orange-950/30'
                : 'bg-[#10243d] text-slate-300 ring-1 ring-white/10 hover:bg-[#163254] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="relative shrink-0 space-y-3 pt-2">
        <button onClick={onImportPdf} className="w-full rounded-2xl bg-[#f97316] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]">
          + Add Documents
        </button>
        <div className="rounded-2xl bg-[#10243d] p-3.5 text-sm font-semibold text-slate-300 ring-1 ring-orange-400/15">
          {docCount} local document{docCount !== 1 ? 's' : ''}
        </div>
      </div>
    </aside>
  )
}
