import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage, SourceCitation } from '../types'
import { fetchChatHistory, sendChatMessage } from '../api'
import LoadingSpinner from './LoadingSpinner'

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
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#071527]">
      <header className="shrink-0 px-8 pt-6">
        <div className="rounded-4xl bg-[#0d2038] px-5 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-black text-white">AI Tutor</h1>
            <div className="rounded-2xl bg-[#071527] px-4 py-3 text-right ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Document scope</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{selectedDocIds.length > 0 ? `${selectedDocIds.length} selected` : 'All documents'}</p>
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
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="text-xs font-bold text-slate-400 mb-1.5">Sources</p>
                    {msg.sources.map((s: SourceCitation, i: number) => (
                      <p key={i} className="text-xs text-slate-500">{s.filename}, p.{s.page}</p>
                    ))}
                  </div>
                )}
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
  )
}
