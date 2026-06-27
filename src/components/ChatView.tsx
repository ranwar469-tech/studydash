import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, SourceCitation } from '../types'
import { fetchChatHistory, sendChatMessage } from '../api'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  studySetId: string
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your AI Study Tutor. I've read through your uploaded materials. Ask me anything and I can explain concepts, give examples, or help you work through problems.",
}

export default function ChatView({ studySetId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const assistantId = useRef<string | null>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingHistory(true)
      try {
        const history = await fetchChatHistory(studySetId)
        if (!cancelled && history.length > 0) setMessages([welcomeMessage, ...history])
      } catch {
        // Backend not connected — use welcome message only
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

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
    const aid = (Date.now() + 1).toString()
    assistantId.current = aid
    const placeholder: ChatMessage = { id: aid, role: 'assistant', content: '' }

    setMessages(m => [...m, userMsg, placeholder])
    setInput('')
    setIsStreaming(true)

    let fullContent = ''

    try {
      await sendChatMessage(
        studySetId,
        text,
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
      <main className="flex flex-1 flex-col bg-[#071527] items-center justify-center">
        <LoadingSpinner label="Loading chat..." />
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-[#071527]">
      <header className="shrink-0 px-8 pt-8">
        <div className="w-full rounded-[2rem] bg-[#0d2038] px-7 py-5 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Study mode</p>
          <h1 className="mt-1 text-3xl font-black text-white">AI Tutor</h1>
        </div>
      </header>

      {error && (
        <div className="mt-4 mx-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-[1.5rem] px-5 py-4 text-base leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-md bg-[#f97316] text-white shadow-orange-950/20'
                  : 'rounded-tl-md bg-[#0d2038] text-slate-200 ring-1 ring-white/10'
              }`}>
                {msg.content ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : isStreaming && msg.id === assistantId.current ? (
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.2s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : null}
                {msg.sources && msg.sources.length > 0 && msg.content && (
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
        <div className="px-8 pb-4">
          <div className="flex flex-wrap gap-2">
            {['Summarize this document', 'Explain key concepts', 'Generate a quiz', 'Create flashcards'].map(text => (
              <button key={text} onClick={() => send(text)}
                className="rounded-2xl bg-[#10243d] px-4 py-3 text-sm font-bold text-slate-200 shadow-sm ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#163254] hover:text-orange-300">
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-8 pb-8">
        <div className="flex gap-3 rounded-[1.75rem] bg-[#0d2038] p-3 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
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
    </main>
  )
}
