export type Page = 'library' | 'documents' | 'study-tools'

interface Props {
  activePage: Page
  onNavigate: (page: Page) => void
}

export default function Sidebar({ activePage, onNavigate }: Props) {
  const navItems: { label: string; page: Page }[] = [
    { label: 'Library', page: 'library' },
    { label: 'Documents', page: 'documents' },
    { label: 'Study tools', page: 'study-tools' },
  ]

  return (
    <aside className="relative flex h-screen w-80 shrink-0 flex-col overflow-hidden bg-[#061226] px-5 py-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.18),transparent_38%),linear-gradient(180deg,#071a32_0%,#061226_100%)]" />

      <div className="relative px-1 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-[#f97316] shadow-2xl shadow-orange-950/50 ring-4 ring-orange-400/15">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-black leading-none tracking-tight text-white">StudyDash</p>
            <p className="mt-2 text-sm font-semibold text-orange-200">Local AI study companion</p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 space-y-3">
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.page)}
            className={`min-h-16 w-full rounded-3xl px-5 text-left transition-all ${
              activePage === item.page
                ? 'bg-[#f97316] text-white shadow-xl shadow-orange-950/35'
                : 'bg-[#10243d] text-slate-300 ring-1 ring-white/10 hover:bg-[#163254] hover:text-white'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-semibold">{item.label}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="relative rounded-3xl bg-[#10243d] p-4 ring-1 ring-orange-400/15">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f97316] text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Local Library</p>
            <p className="text-xs text-slate-400">Saved on this device</p>
          </div>
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10243d] px-4 py-3 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
      </div>
    </aside>
  )
}
