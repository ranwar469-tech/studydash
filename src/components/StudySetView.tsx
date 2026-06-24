import { useState } from 'react'
import type { StudySet, StudyMode } from '../types'
import StudySetSidebar from './StudySetSidebar'
import ChatView from './ChatView'
import SummaryView from './SummaryView'
import FlashcardView from './FlashcardView'
import QuizView from './QuizView'
import NotesView from './NotesView'

interface Props {
  studySet: StudySet
  onBack: () => void
  onImportPdf: (studySetId: string) => void
}

export default function StudySetView({ studySet, onBack, onImportPdf }: Props) {
  const [activeMode, setActiveMode] = useState<StudyMode>('tutor')

  const renderContent = () => {
    switch (activeMode) {
      case 'tutor':
        return <ChatView studySetId={studySet.id} />
      case 'summary':
        return <SummaryView studySetId={studySet.id} />
      case 'flashcards':
        return <FlashcardView studySetId={studySet.id} />
      case 'quiz':
        return <QuizView studySetId={studySet.id} />
      case 'notes':
        return <NotesView studySetId={studySet.id} />
      default:
        return <ChatView studySetId={studySet.id} />
    }
  }

  return (
    <div className="grid h-screen overflow-hidden bg-[#071527]" style={{ gridTemplateColumns: '320px 1fr' }}>
      <StudySetSidebar
        studySet={studySet}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onBack={onBack}
        onImportPdf={() => onImportPdf(studySet.id)}
      />
      {renderContent()}
    </div>
  )
}
