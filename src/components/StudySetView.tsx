import { useEffect, useState } from 'react'
import type { StudySet, StudyMode } from '../types'
import type { DocInfo } from '../api'
import { fetchSetDocuments } from '../api'
import StudySetSidebar from './StudySetSidebar'
import ContextSidebar from './ContextSidebar'
import ChatView from './ChatView'
import SummaryView from './SummaryView'
import FlashcardView from './FlashcardView'
import QuizView from './QuizView'
import NotesView from './NotesView'

interface Props {
  studySet: StudySet
  onBack: () => void
  onImportPdf: (studySetId: string) => void
  refreshKey?: number
}

export default function StudySetView({ studySet, onBack, onImportPdf, refreshKey }: Props) {
  const [activeMode, setActiveMode] = useState<StudyMode>('tutor')
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [documents, setDocuments] = useState<DocInfo[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [showContext, setShowContext] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDocuments() {
      setLoadingDocuments(true)
      try {
        const docs = await fetchSetDocuments(studySet.id)
        if (cancelled) return
        setDocuments(docs)
        setSelectedDocIds(docs.map(doc => doc.id))
      } catch {
        if (!cancelled) {
          setDocuments([])
          setSelectedDocIds([])
        }
      } finally {
        if (!cancelled) setLoadingDocuments(false)
      }
    }

    loadDocuments()
    return () => { cancelled = true }
  }, [studySet.id, refreshKey])

  const handleToggleDoc = (docId: string) => {
    if (docId === '__select_all__') {
      const allSelected = documents.length > 0 && selectedDocIds.length === documents.length
      setSelectedDocIds(allSelected ? [] : documents.map(doc => doc.id))
      return
    }
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(x => x !== docId) : [...prev, docId]
    )
  }

  const renderContent = () => {
    switch (activeMode) {
      case 'tutor':
        return <ChatView studySetId={studySet.id} selectedDocIds={selectedDocIds} />
      case 'summary':
        return <SummaryView studySetId={studySet.id} selectedDocIds={selectedDocIds} />
      case 'flashcards':
        return <FlashcardView studySetId={studySet.id} selectedDocIds={selectedDocIds} />
      case 'quiz':
        return <QuizView studySetId={studySet.id} selectedDocIds={selectedDocIds} />
      case 'notes':
        return <NotesView studySetId={studySet.id} />
      default:
        return <ChatView studySetId={studySet.id} selectedDocIds={selectedDocIds} />
    }
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#071527] text-slate-100">
      <StudySetSidebar
        studySet={studySet}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onBack={onBack}
        onImportPdf={() => onImportPdf(studySet.id)}
        docCount={documents.length}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        {renderContent()}
      </div>
      {showContext && (
        <ContextSidebar
          studySetId={studySet.id}
          selectedDocIds={selectedDocIds}
          onToggleDoc={handleToggleDoc}
          onClose={() => setShowContext(false)}
          documents={documents}
          isLoading={loadingDocuments}
        />
      )}
      {!showContext && (
        <button
          onClick={() => setShowContext(true)}
          className="fixed right-0 top-6 z-20 rounded-l-2xl bg-[#0d2038] px-3 py-3 text-slate-400 shadow-lg shadow-black/20 ring-1 ring-white/10 transition hover:bg-[#163254] hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l7-7-7-7" /></svg>
        </button>
      )}
    </div>
  )
}
