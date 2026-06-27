import { useState, useEffect } from 'react'
import type { Note } from '../types'
import { fetchNotes, createNote as apiCreateNote, deleteNote } from '../api'
import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  studySetId: string
}

export default function NotesView({ studySetId }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  const load = () => {
    fetchNotes(studySetId)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [studySetId])

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    try {
      await apiCreateNote(studySetId, { title: newTitle.trim(), content: newContent.trim() })
      setNewTitle('')
      setNewContent('')
      setShowForm(false)
      load()
    } catch (e: any) {
      console.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    try { await deleteNote(id); load() } catch {}
  }

  if (loading) return <main className="h-full w-full bg-[#071527]"><LoadingSpinner /></main>

  return (
    <main className="h-full w-full overflow-y-auto bg-[#071527]">
      <div className="w-full px-8 py-8">
        <header className="mb-6 flex items-center justify-between gap-4 rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div>
            <h2 className="text-2xl font-black text-white">Notes</h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]"
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

        {notes.length === 0 && !showForm ? (
          <EmptyState
            title="No notes yet"
            description="Write notes to capture key insights from your study materials."
            action={{ label: 'New Note', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid gap-4">
            {notes.map(note => (
              <article key={note.id} className="group rounded-[2rem] bg-[#0d2038] p-6 shadow-xl shadow-black/10 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-orange-400/30">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-black text-white">{note.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-[#132a49] px-3 py-1 text-xs font-bold text-orange-200">
                      {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                    </span>
                    <button onClick={() => handleDelete(note.id)}
                      className="rounded-xl p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
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
