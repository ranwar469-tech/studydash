import { useEffect, useState, type MouseEvent } from 'react'
import { fetchSetDocuments, deleteDocument } from '../api'
import type { DocInfo } from '../api'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  studySetId: string
  selectedDocIds: string[]
  onToggleDoc: (docId: string) => void
  onClose: () => void
  isLoading?: boolean
  documents?: DocInfo[]
}

export default function ContextSidebar({ studySetId, selectedDocIds, onToggleDoc, onClose, isLoading = false, documents }: Props) {
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDocs() {
      setLoading(true)
      try {
        const result = documents ?? await fetchSetDocuments(studySetId)
        if (!cancelled) setDocs(result)
      } catch {
        if (!cancelled) setDocs([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDocs()
    return () => { cancelled = true }
  }, [documents, studySetId])

  const handleDeleteDoc = async (event: MouseEvent<HTMLButtonElement>, docId: string) => {
    event.preventDefault()
    if (!confirm('Delete this document? Its chunks will be removed.')) return
    try {
      await deleteDocument(docId)
      const refreshed = await fetchSetDocuments(studySetId)
      setDocs(refreshed)
    } catch {
      // ignore delete failures in the side panel
    }
  }

  const visibleDocs = docs.length > 0 ? docs : documents ?? []

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-white/5 bg-[#061226] px-4 py-6 text-white">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-300">Context</p>
          <p className="mt-1 text-xs text-slate-500">{visibleDocs.length} document{visibleDocs.length !== 1 ? 's' : ''} · {selectedDocIds.length} active</p>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200" aria-label="Close context panel">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="mb-4 rounded-[1.5rem] bg-[#0d2038] px-4 py-4 ring-1 ring-white/10">
        <p className="text-sm font-semibold text-slate-200">Scope</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">Only the selected PDFs are used when you chat, summarize, generate flashcards, or build quiz questions.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading || isLoading ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center">
            <LoadingSpinner label="Loading documents..." />
          </div>
        ) : visibleDocs.length === 0 ? (
          <div className="rounded-[1.5rem] bg-[#0d2038] p-5 text-center ring-1 ring-white/10">
            <svg className="mx-auto mb-3 h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-semibold text-slate-200">No documents yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Use the left sidebar to upload PDFs into this study set.</p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {visibleDocs.map(doc => {
              const active = selectedDocIds.includes(doc.id)
              return (
                <div key={doc.id} className={`group rounded-2xl border px-3 py-3 transition ${active ? 'border-orange-400/30 bg-[#10243d]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => onToggleDoc(doc.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-700 text-[#f97316] accent-[#f97316]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold leading-snug text-slate-100">{doc.filename}</p>
                        <p className="mt-1 text-xs text-slate-500">{doc.chunk_count} chunks</p>
                      </div>
                    </label>
                    <button
                      onClick={(event) => handleDeleteDoc(event, doc.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                      title="Delete document"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 shrink-0 border-t border-white/5 pt-4">
        <button
          onClick={() => onToggleDoc('__select_all__')}
          className="w-full rounded-2xl bg-[#10243d] px-3 py-3 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white"
        >
          {selectedDocIds.length === visibleDocs.length && visibleDocs.length > 0 ? 'Deselect all' : 'Select all'}
        </button>
      </div>
    </aside>
  )
}
