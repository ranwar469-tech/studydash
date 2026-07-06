import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { fetchAllDocuments } from '../api'
import type { DocInfo } from '../api'
import EmptyState from './EmptyState'

// PDF.js worker — loaded from CDN (avoids Vite node_modules resolution issues)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const BASE = 'http://localhost:8000/api'

export default function DocumentsView() {
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewingDoc, setViewingDoc] = useState<DocInfo | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)

  const load = () => {
    setLoading(true)
    fetchAllDocuments()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Close viewer on Escape key
  const closeViewer = useCallback(() => {
    setViewingDoc(null)
    setNumPages(0)
    setPageNumber(1)
  }, [])
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeViewer()
  }, [closeViewer])
  useEffect(() => {
    if (viewingDoc) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [viewingDoc, handleKeyDown])

  const filtered = docs.filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.study_set_title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527]">
      <div className="w-full px-8 py-8">
        <header className="mb-6 rounded-4xl bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Local storage</p>
              <h1 className="text-4xl font-black text-white">Documents</h1>
              <p className="mt-2 text-base text-slate-400">{docs.length} PDFs</p>
            </div>
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-2xl bg-[#071527] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>
          </div>
        </header>

        {loading ? null : docs.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Open a study set and upload PDFs to see them here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching documents"
            description="Try a different search term."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(doc => (
              <button
                type="button"
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="group rounded-3xl bg-[#0d2038] p-5 text-left shadow-xl shadow-black/10 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-orange-400/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10243d] ring-1 ring-white/10 transition group-hover:bg-orange-400/10 group-hover:ring-orange-400/30">
                      <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{doc.filename}</p>
                      <p className="text-xs text-slate-400">{doc.study_set_title}</p>
                      {doc.ocr_pages > 0 && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-teal-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 ring-1 ring-teal-400/20">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          OCR • {doc.ocr_pages} page{doc.ocr_pages !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="mt-1 h-4 w-4 shrink-0 text-slate-600 opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {doc.chunk_count} chunks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── PDF Viewer Modal ── */}
        {viewingDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={closeViewer}
          >
            <div
              className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-4xl bg-[#0d2038] shadow-2xl shadow-black/40 ring-1 ring-white/10"
              onClick={e => e.stopPropagation()}
            >
              {/* Toolbar */}
              <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4 border-b border-white/6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 ring-1 ring-orange-400/30">
                    <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{viewingDoc.filename}</p>
                    <p className="text-xs text-slate-400">{viewingDoc.study_set_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${BASE}/documents/${viewingDoc.id}/file`}
                    download={viewingDoc.filename}
                    className="rounded-xl bg-[#10243d] px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white"
                  >
                    Download
                  </a>
                  <button
                    onClick={closeViewer}
                    className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-400 hover:ring-red-400/30"
                    title="Close (Esc)"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* PDF Content */}
              <div className="flex-1 overflow-auto bg-[#0a1628] flex justify-center">
                <Document
                  file={`${BASE}/documents/${viewingDoc.id}/file`}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.2s' }} />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  }
                  className="flex flex-col items-center py-6"
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="mb-6 shadow-2xl shadow-black/30"
                  />
                </Document>
              </div>

              {/* Page Navigation */}
              {numPages > 0 && (
                <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/6 px-6 py-3">
                  <button
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-slate-300 tabular-nums">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                    className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
