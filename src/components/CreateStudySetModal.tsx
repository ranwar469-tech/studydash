import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: { title: string; subject: string }) => void
}

export default function CreateStudySetModal({ open, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')

  if (!open) return null

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), subject: subject.trim() || 'General' })
    setTitle('')
    setSubject('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/40 ring-1 ring-white/10 animate-fadein">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-xl font-black text-white mb-6">New Study Set</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full rounded-2xl bg-[#071527] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Computer Science"
              className="w-full rounded-2xl bg-[#071527] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400/50"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full rounded-2xl bg-[#f97316] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-40"
        >
          Create Study Set
        </button>
      </div>
    </div>
  )
}
