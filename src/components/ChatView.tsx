import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import type { ChatMessage, SourceCitation, ChatTutorMode } from '../types'
import { fetchChatHistory, sendChatMessage } from '../api'
import LoadingSpinner from './LoadingSpinner'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const BASE = 'http://localhost:8000/api'

interface Props {
  studySetId: string
  selectedDocIds: string[]
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your AI Study Tutor. I've read through your uploaded materials. Ask me anything and I can explain concepts, give examples, or help you work through problems.",
}

export default function ChatView({ studySetId, selectedDocIds }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<ChatTutorMode>('default')
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [pdfFileId, setPdfFileId] = useState<string | null>(null)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfFilename, setPdfFilename] = useState('')
  const [pdfNumPages, setPdfNumPages] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const assistantId = useRef<string | null>(null)
  const quickPrompts = useMemo(() => ([
    'Summarize the key ideas',
    'Explain the hardest concept',
    'Generate a quiz from these notes',
    'Make flashcards from the material',
  ]), [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isStreaming])

  useEffect(() => {
    let cancelled = false
    setLoadingHistory(true)

    async function load() {
      try {
        const history = await fetchChatHistory(studySetId)
        if (!cancelled) {
          setMessages(history.length > 0 ? [welcomeMessage, ...history] : [welcomeMessage])
        }
      } catch {
        if (!cancelled) setMessages([welcomeMessage])
      } finally {
        if (!cancelled) setLoadingHistory(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [studySetId])

  const send = async (text: string) => {
    if (!text.trim() || isStreaming) return
    setError('')

    const userMsg: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: text.trim() }
    const aid = `${Date.now()}-assistant`
    assistantId.current = aid
    const placeholder: ChatMessage = { id: aid, role: 'assistant', content: '' }

    setMessages(m => [...m, userMsg, placeholder])
    setIsStreaming(true)
    setInput('')

    let fullContent = ''

    try {
      await sendChatMessage(
        studySetId,
        text.trim(),
        (chunk) => {
          fullContent += chunk
          setMessages(m => {
            const updated = [...m]
            const idx = updated.findIndex(msg => msg.id === aid)
            if (idx !== -1) updated[idx] = { ...updated[idx], content: fullContent }
            return updated
          })
        },
        (sources) => {
          setMessages(m => {
            const updated = [...m]
            const idx = updated.findIndex(msg => msg.id === aid)
            if (idx !== -1) updated[idx] = { ...updated[idx], sources }
            return updated
          })
        },
        selectedDocIds.length > 0 ? selectedDocIds : undefined,
        mode,
      )
      setMessages(m => {
        const updated = [...m]
        const idx = updated.findIndex(msg => msg.id === aid)
        if (idx !== -1) updated[idx] = { ...updated[idx], content: fullContent }
        return updated
      })
    } catch (e: any) {
      setError(e.message || 'Chat failed')
      setMessages(m => m.filter(msg => msg.id !== aid))
    } finally {
      setIsStreaming(false)
      assistantId.current = null
    }
  }

  if (loadingHistory) {
    return (
      <main className="flex h-full min-h-0 w-full items-center justify-center bg-[#071527] px-6">
        <LoadingSpinner label="Loading chat..." />
      </main>
    )
  }

  return (
    <>
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#071527]">
      <header className="shrink-0 px-8 pt-6">
        <div className="rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-black text-white">AI Tutor</h1>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={mode}
                onChange={e => setMode(e.target.value as ChatTutorMode)}
                className="rounded-2xl bg-[#071527] px-4 py-2.5 text-sm font-semibold text-slate-200 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-orange-400/50 cursor-pointer"
              >
                <option value="default">🧠 Standard</option>
                <option value="elif">🧒 ELIF (Explain Like I'm Five)</option>
                <option value="deep">🔬 Deep Dive Analysis</option>
              </select>
              <div className="rounded-2xl bg-[#071527] px-4 py-3 text-right ring-1 ring-white/10">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Document scope</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">{selectedDocIds.length > 0 ? `${selectedDocIds.length} selected` : 'All documents'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-8 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[min(52rem,84%)] rounded-3xl px-5 py-4 text-base leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-md bg-[#f97316] text-white shadow-orange-950/20'
                  : 'rounded-tl-md bg-[#0d2038] text-slate-200 ring-1 ring-white/10'
              }`}>
                {msg.content ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_strong]:text-white [&_p]:mb-2 [&_ul]:mb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : isStreaming && msg.id === assistantId.current ? (
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.2s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : null}
                {msg.sources && msg.sources.length > 0 && (() => {
                  // Deduplicate by filename + page
                  const seen = new Set<string>()
                  const unique = msg.sources.filter(s => {
                    const key = `${s.filename}|${s.page}`
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                  })
                  const isExpanded = expandedSources.has(msg.id)
                  const visible = isExpanded ? unique : unique.slice(0, 3)
                  const hiddenCount = unique.length - 3
                  const toggle = () => setExpandedSources(prev => {
                    const next = new Set(prev)
                    if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id)
                    return next
                  })
                  const openSource = (s: SourceCitation) => {
                    if (!s.document_id) return
                    setPdfFilename(s.filename)
                    setPdfPage(s.page || 1)
                    setPdfFileId(s.document_id)
                  }
                  return (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-xs font-bold text-slate-400 mb-1.5">Sources</p>
                      {visible.map((s: SourceCitation, i: number) => (
                        <button
                          key={i}
                          onClick={() => openSource(s)}
                          className="block w-full text-left text-xs text-slate-500 transition hover:text-orange-400 py-0.5 hover:underline underline-offset-2"
                        >
                          [{s.chunk_id}] {s.filename}, p.{s.page}
                        </button>
                      ))}
                      {hiddenCount > 0 && !isExpanded && (
                        <button
                          onClick={toggle}
                          className="mt-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                        >
                          + {hiddenCount} more
                        </button>
                      )}
                      {isExpanded && msg.sources.length > 3 && (
                        <button
                          onClick={toggle}
                          className="mt-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
                        >
                          − Show less
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {messages.length <= 2 && !isStreaming && (
        <div className="shrink-0 px-8 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickPrompts.map(text => (
              <button
                key={text}
                onClick={() => send(text)}
                className="rounded-2xl bg-[#10243d] px-4 py-3 text-left text-sm font-bold text-slate-200 shadow-sm ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#163254] hover:text-orange-300"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-8 pb-8">
        <div className="rounded-[1.75rem] bg-[#0d2038] p-3 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              placeholder="Ask a question..."
              disabled={isStreaming}
              className="min-w-0 flex-1 rounded-2xl bg-[#071527] px-5 py-4 text-base text-white outline-none placeholder:text-slate-500 disabled:opacity-50 focus:ring-2 focus:ring-orange-400/50"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || isStreaming}
              className="shrink-0 rounded-2xl bg-[#f97316] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-40">
              Send
            </button>
          </div>
        </div>
      </div>
    </main>

    {/* ── PDF Viewer Modal (opened from source clicks) ── */}
    {pdfFileId && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={() => setPdfFileId(null)}
      >
        <div
          className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-4xl bg-[#0d2038] shadow-2xl shadow-black/40 ring-1 ring-white/10"
          onClick={e => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4 border-b border-white/6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 ring-1 ring-orange-400/30">
                <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="truncate text-sm font-bold text-white">{pdfFilename}</p>
            </div>
            <button
              onClick={() => setPdfFileId(null)}
              className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-400 hover:ring-red-400/30"
              title="Close (Esc)"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-[#0a1628] flex justify-center">
            <Document
              key={pdfFileId}
              file={`${BASE}/documents/${pdfFileId}/file`}
              onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
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
                pageNumber={pdfPage}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="mb-6 shadow-2xl shadow-black/30"
              />
            </Document>
          </div>

          {/* Page Navigation */}
          {pdfNumPages > 0 && (
            <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/6 px-6 py-3">
              <button
                onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                disabled={pdfPage <= 1}
                className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                Page {pdfPage} of {pdfNumPages}
              </span>
              <button
                onClick={() => setPdfPage(p => Math.min(pdfNumPages, p + 1))}
                disabled={pdfPage >= pdfNumPages}
                className="rounded-xl bg-[#10243d] p-2 text-slate-400 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  )
}
