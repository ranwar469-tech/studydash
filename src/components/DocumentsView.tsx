import { useState } from 'react'
import EmptyState from './EmptyState'

interface DocItem {
  id: string
  filename: string
  studySet: string
  studySetId: string
  uploadedAt: string
  chunkCount: number
}

const mockDocs: DocItem[] = [
  { id: 'd1', filename: 'dsa-lecture-1.pdf', studySet: 'Data Structures & Algorithms', studySetId: '1', uploadedAt: '2 days ago', chunkCount: 24 },
  { id: 'd2', filename: 'dsa-lecture-2.pdf', studySet: 'Data Structures & Algorithms', studySetId: '1', uploadedAt: '2 days ago', chunkCount: 31 },
  { id: 'd3', filename: 'algo-complexity.pdf', studySet: 'Data Structures & Algorithms', studySetId: '1', uploadedAt: '1 day ago', chunkCount: 18 },
  { id: 'd4', filename: 'linear-algebra-ch1.pdf', studySet: 'Linear Algebra', studySetId: '2', uploadedAt: 'Yesterday', chunkCount: 22 },
  { id: 'd5', filename: 'linear-algebra-ch2.pdf', studySet: 'Linear Algebra', studySetId: '2', uploadedAt: 'Yesterday', chunkCount: 19 },
  { id: 'd6', filename: 'ml-intro.pdf', studySet: 'Machine Learning Basics', studySetId: '3', uploadedAt: '3 days ago', chunkCount: 45 },
  { id: 'd7', filename: 'ml-supervised.pdf', studySet: 'Machine Learning Basics', studySetId: '3', uploadedAt: '3 days ago', chunkCount: 38 },
  { id: 'd8', filename: 'ml-unsupervised.pdf', studySet: 'Machine Learning Basics', studySetId: '3', uploadedAt: '3 days ago', chunkCount: 27 },
  { id: 'd9', filename: 'ochem-ch1.pdf', studySet: 'Organic Chemistry', studySetId: '4', uploadedAt: '1 week ago', chunkCount: 33 },
  { id: 'd10', filename: 'ochem-ch2.pdf', studySet: 'Organic Chemistry', studySetId: '4', uploadedAt: '1 week ago', chunkCount: 29 },
  { id: 'd11', filename: 'async-js.pdf', studySet: 'Async JavaScript Pitfalls', studySetId: '5', uploadedAt: 'Just now', chunkCount: 15 },
]

export default function DocumentsView() {
  const [docs] = useState<DocItem[]>(mockDocs)
  const [search, setSearch] = useState('')

  const filtered = docs.filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.studySet.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex-1 overflow-y-auto bg-[#071527]">
      <div className="w-full px-8 py-8">
        <header className="mb-6 rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/20 ring-1 ring-orange-400/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Local storage</p>
              <h1 className="text-4xl font-black text-white">Documents</h1>
              <p className="mt-2 text-base text-slate-400">{docs.length} PDFs across 5 study sets</p>
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

        {filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching documents' : 'No documents yet'}
            description={search ? 'Try a different search term.' : 'Upload a PDF inside a study set to see it here.'}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="group rounded-[1.5rem] bg-[#0d2038] p-5 shadow-xl shadow-black/10 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-orange-400/30"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10243d] ring-1 ring-white/10">
                      <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{doc.filename}</p>
                      <p className="text-xs text-slate-400">{doc.studySet}</p>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-xl p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {doc.chunkCount} chunks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {doc.uploadedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
