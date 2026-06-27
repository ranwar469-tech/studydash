import type { StudySet, Flashcard, QuizQuestion, ChatMessage, Note, SourceCitation } from './types'

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

/* ── Type mappings ──────────────────────────────────────── */

interface RawStudySet {
  id: string; title: string; subject: string
  document_count: number; created_at: string; updated_at: string
}
function mapSet(r: RawStudySet): StudySet {
  const progress = { unfamiliar: 0, learning: 0, familiar: 0, mastered: 0 }
  return { id: r.id, title: r.title, subject: r.subject, progress, documentCount: r.document_count, lastStudied: '' }
}

interface RawQuizQuestion {
  id: string; question: string; options: string[]
  correct_index: number; explanation: string
}
function mapQuiz(r: RawQuizQuestion): QuizQuestion {
  return { id: r.id, question: r.question, options: r.options, correctIndex: r.correct_index, explanation: r.explanation }
}

/* ── Study Sets ─────────────────────────────────────────── */

export async function fetchStudySets(): Promise<StudySet[]> {
  const raw = await request<RawStudySet[]>('/study-sets')
  return raw.map(mapSet)
}

export async function createStudySet(data: { title: string; subject: string }): Promise<StudySet> {
  const raw = await request<RawStudySet>('/study-sets', { method: 'POST', body: JSON.stringify(data) })
  return mapSet(raw)
}

export async function deleteStudySet(id: string): Promise<void> {
  await request(`/study-sets/${id}`, { method: 'DELETE' })
}

/* ── Documents ──────────────────────────────────────────── */

export interface DocInfo {
  id: string
  study_set_id: string
  study_set_title: string
  filename: string
  chunk_count: number
  uploaded_at: string
}

export async function fetchAllDocuments(): Promise<DocInfo[]> {
  return request<DocInfo[]>('/documents')
}

export async function uploadDocument(
  setId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<DocInfo> {
  const form = new FormData()
  form.append('file', file)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
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

/* ── Chat ───────────────────────────────────────────────── */

export async function fetchChatHistory(setId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/study-sets/${setId}/chat`)
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
          try { onSources(JSON.parse(data.slice(9))) } catch { /* ignore */ }
        } else {
          onChunk(data)
        }
      }
    }
  }
}

/* ── Flashcards ─────────────────────────────────────────── */

export async function fetchFlashcards(setId: string): Promise<Flashcard[]> {
  return request<Flashcard[]>(`/study-sets/${setId}/flashcards`)
}

export async function generateFlashcards(setId: string): Promise<Flashcard[]> {
  return request<Flashcard[]>(`/study-sets/${setId}/flashcards/generate`, { method: 'POST' })
}

export async function updateFlashcardMastery(id: string, mastery: string): Promise<void> {
  await request(`/flashcards/${id}`, { method: 'PATCH', body: JSON.stringify({ mastery }) })
}

/* ── Quiz ───────────────────────────────────────────────── */

export async function fetchQuiz(setId: string): Promise<QuizQuestion[]> {
  const raw = await request<RawQuizQuestion[]>(`/study-sets/${setId}/quiz`)
  return raw.map(mapQuiz)
}

export async function generateQuiz(setId: string): Promise<QuizQuestion[]> {
  const raw = await request<RawQuizQuestion[]>(`/study-sets/${setId}/quiz/generate`, { method: 'POST' })
  return raw.map(mapQuiz)
}

export async function submitQuiz(
  setId: string,
  answers: { question_id: string; selected_index: number }[],
): Promise<{ score: number; total: number }> {
  return request(`/study-sets/${setId}/quiz/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

/* ── Summary ────────────────────────────────────────────── */

export async function generateSummary(
  setId: string,
): Promise<{ content: string; sections: { title: string; desc: string }[]; takeaways: string[] }> {
  return request(`/study-sets/${setId}/summary`, { method: 'POST' })
}

/* ── Notes ──────────────────────────────────────────────── */

export async function fetchNotes(setId: string): Promise<Note[]> {
  return request<Note[]>(`/study-sets/${setId}/notes`)
}

export async function createNote(setId: string, data: { title: string; content: string }): Promise<Note> {
  return request<Note>(`/study-sets/${setId}/notes`, { method: 'POST', body: JSON.stringify(data) })
}

export async function updateNote(id: string, data: { title?: string; content?: string }): Promise<Note> {
  return request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteNote(id: string): Promise<void> {
  await request(`/notes/${id}`, { method: 'DELETE' })
}
