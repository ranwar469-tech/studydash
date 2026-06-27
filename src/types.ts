export interface Progress {
  unfamiliar: number
  learning: number
  familiar: number
  mastered: number
}

export interface StudySet {
  id: string
  title: string
  subject: string
  progress: Progress
  documentCount: number
  lastStudied: string
}

export type StudyMode = 'tutor' | 'summary' | 'flashcards' | 'quiz' | 'notes'

export interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  mastery?: 'unfamiliar' | 'learning' | 'familiar' | 'mastered'
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceCitation[]
}

export interface SourceCitation {
  filename: string
  page: number
  chunk_text: string
}

export interface Document {
  id: string
  study_set_id: string
  study_set_title?: string
  filename: string
  filepath: string
  chunk_count: number
  uploaded_at: string
}

export interface Note {
  id: string
  study_set_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface ApiError {
  detail: string
}
