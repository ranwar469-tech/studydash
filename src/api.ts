import type { StudySet, Flashcard, QuizQuestion, ChatMessage, Document, Note, SourceCitation } from './types'

const BASE = 'http://localhost:8000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

export async function uploadDocument(
  setId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  const xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
      else reject(new Error(`Upload failed: ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.open('POST', `${BASE}/study-sets/${setId}/documents`)
    xhr.send(form)
  })
}

export async function sendChatMessage(
  setId: string,
  message: string,
  onChunk: (text: string) => void,
  onSources: (sources: SourceCitation[]) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/study-sets/${setId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        if (data.startsWith('[SOURCES]')) {
          try { onSources(JSON.parse(data.slice(9))) } catch {}
        } else {
          onChunk(data)
        }
      }
    }
  }
}

export const studySets = {
  list: () => request<StudySet[]>('/study-sets'),
  create: (data: { title: string; subject: string }) =>
    request<StudySet>('/study-sets', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request<StudySet>(`/study-sets/${id}`),
  del: (id: string) => request<void>(`/study-sets/${id}`, { method: 'DELETE' }),
}

export const documents = {
  list: (setId: string) => request<Document[]>(`/study-sets/${setId}/documents`),
  del: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
}

export const chat = {
  history: (setId: string) => request<ChatMessage[]>(`/study-sets/${setId}/chat`),
}

export const flashcards = {
  list: (setId: string) => request<Flashcard[]>(`/study-sets/${setId}/flashcards`),
  generate: (setId: string) =>
    request<Flashcard[]>(`/study-sets/${setId}/flashcards/generate`, { method: 'POST' }),
  updateMastery: (id: string, mastery: string) =>
    request<void>(`/flashcards/${id}`, { method: 'PATCH', body: JSON.stringify({ mastery }) }),
}

export const quiz = {
  list: (setId: string) => request<QuizQuestion[]>(`/study-sets/${setId}/quiz`),
  generate: (setId: string) =>
    request<QuizQuestion[]>(`/study-sets/${setId}/quiz/generate`, { method: 'POST' }),
  submit: (setId: string, answers: { question_id: string; selected_index: number }[]) =>
    request<{ score: number; total: number }>(`/study-sets/${setId}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
}

export const summary = {
  generate: (setId: string) =>
    request<{ content: string; sections: { title: string; desc: string }[]; takeaways: string[] }>(
      `/study-sets/${setId}/summary`,
      { method: 'POST' },
    ),
}

export const notes = {
  list: (setId: string) => request<Note[]>(`/study-sets/${setId}/notes`),
  create: (setId: string, data: { title: string; content: string }) =>
    request<Note>(`/study-sets/${setId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; content?: string }) =>
    request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  del: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
}
