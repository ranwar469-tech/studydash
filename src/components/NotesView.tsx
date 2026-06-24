import { useState } from 'react'
import EmptyState from './EmptyState'

interface Props {
  studySetId: string
}

interface NoteItem {
  title: string
  content: string
  date: string
}

const initialNotes: NoteItem[] = [
  { title: 'Async Programming Quadrants', content: 'Sync + single: function calls / sync + multiple: iterables / async + single: Promises / async + multiple: Observables', date: '2 days ago' },
  { title: 'Promise Limitations', content: 'No built-in cancellation / single value only / no native retry or backoff / cannot handle streams of events', date: '2 days ago' },
  { title: 'Observable Operations', content: 'map transforms / filter keeps matches / flatMap flattens nested streams / takeUntil stops on signal', date: 'Yesterday' },
  { title: 'async/await Reference', content: 'async function returns Promise / await pauses until resolved / try-catch handles errors / still single-value only', date: 'Yesterday' },
]

export default function NotesView({ studySetId: _studySetId }: Props) {
  // TODO: Replace with api.notes.list() + api.notes.create()
  const [notes] = useState<NoteItem[]>(initialNotes)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    // TODO: await api.notes.create(studySetId, { title: newTitle, content: newContent })
    setNewTitle('')
    setNewContent('')
    setShowForm(false)
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527]" style={{ width: '100%' }}>
      <div className="w-full px-8 py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Notebook</p>
            <h2 className="mt-1 text-3xl font-black text-white">Notes</h2>
            <p className="mt-2 text-base text-slate-400">{notes.length} notes saved</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]"
          >
            {showForm ? 'Cancel' : 'New Note'}
          </button>
        </header>

        {showForm && (
          <div className="mb-6 rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full rounded-2xl bg-[#071527] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400/50 mb-3"
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Write your note..."
              rows={4}
              className="w-full rounded-2xl bg-[#071527] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400/50 resize-none mb-4"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || !newContent.trim()}
              className="rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-40"
            >
              Save Note
            </button>
          </div>
        )}

        {notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Write notes to capture key insights from your study materials."
            action={{ label: 'New Note', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid gap-4">
            {notes.map((note, i) => (
              <article key={i} className="rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-orange-400/30">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-black text-white">{note.title}</h3>
                  <span className="shrink-0 rounded-full bg-[#132a49] px-3 py-1 text-xs font-bold text-orange-200">{note.date}</span>
                </div>
                <p className="text-base leading-relaxed text-slate-400">{note.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
