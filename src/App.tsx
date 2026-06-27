import { useState } from 'react'
import Sidebar from './components/Sidebar'
import type { Page } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import DocumentsView from './components/DocumentsView'
import StudySetView from './components/StudySetView'
import CreateStudySetModal from './components/CreateStudySetModal'
import UploadModal from './components/UploadModal'
import type { StudySet } from './types'
import { createStudySet } from './api'

function App() {
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null)
  const [page, setPage] = useState<Page>('library')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadSetId, setUploadSetId] = useState<string | undefined>()
  const [showCreateSet, setShowCreateSet] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const openUpload = (studySetId: string) => {
    setUploadSetId(studySetId)
    setShowUpload(true)
  }

  const handleUploadComplete = () => {
    setRefreshKey(k => k + 1)
  }

  const handleCreateSet = async (data: { title: string; subject: string }) => {
    try {
      const set = await createStudySet(data)
      setSelectedSet(set)
    } catch (e) {
      console.error('Failed to create study set:', e)
    }
  }

  const handleBackToDashboard = () => {
    setSelectedSet(null)
    setPage('library')
  }

  if (selectedSet) {
    return (
      <div className="h-screen overflow-hidden bg-[#071527]">
        <StudySetView
          studySet={selectedSet}
          onBack={handleBackToDashboard}
          onImportPdf={(id) => openUpload(id)}
          refreshKey={refreshKey}
        />
        <UploadModal open={showUpload} studySetId={uploadSetId} onClose={() => setShowUpload(false)} onUploadComplete={handleUploadComplete} />
      </div>
    )
  }

  return (
    <div className="grid h-screen overflow-hidden bg-[#071527]" style={{ gridTemplateColumns: '320px 1fr' }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      {page === 'library' && (
        <Dashboard
          onSelectSet={setSelectedSet}
          onCreateSet={() => setShowCreateSet(true)}
        />
      )}
      {page === 'documents' && <DocumentsView />}
      {page === 'study-tools' && (
        <Dashboard
          onSelectSet={setSelectedSet}
          onCreateSet={() => setShowCreateSet(true)}
        />
      )}
      <CreateStudySetModal open={showCreateSet} onClose={() => setShowCreateSet(false)} onSubmit={handleCreateSet} />
    </div>
  )
}

export default App
