import { useState, useRef } from 'react'

interface Props {
  open: boolean
  studySetId?: string
  onClose: () => void
}

export default function UploadModal({ open, studySetId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFile = (f: File | null) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported')
      return
    }
    setFile(f)
    setError('')
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError('')

    // Simulated upload for demo — replace with: api.uploadDocument(...)
    let pct = 0
    const interval = setInterval(() => {
      pct += Math.random() * 25
      if (pct >= 100) {
        pct = 100
        clearInterval(interval)
        setProgress(100)
        setUploading(false)
        setDone(true)
        setTimeout(() => { onClose(); setFile(null); setDone(false); setProgress(0) }, 1500)
      }
      setProgress(Math.round(pct))
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[2rem] bg-[#0d2038] p-7 shadow-2xl shadow-black/40 ring-1 ring-white/10 animate-fadein">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-xl font-black text-white mb-1">Upload PDF</h2>
        <p className="text-sm text-slate-400 mb-6">
          {studySetId ? 'Add documents to this study set' : 'Select a study set first'}
        </p>

        {!studySetId ? (
          <p className="rounded-2xl bg-[#10243d] px-4 py-5 text-sm font-semibold text-slate-400 text-center ring-1 ring-white/10">
            Open a study set to upload documents into it.
          </p>
        ) : done ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 text-center">
            <svg className="h-8 w-8 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-bold text-emerald-300">Upload complete</p>
          </div>
        ) : (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              className="mb-5 cursor-pointer rounded-2xl border-2 border-dashed border-slate-600 p-8 text-center transition-colors hover:border-orange-400/50 hover:bg-[#10243d]"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null) }}
            >
              <svg className="h-9 w-9 text-slate-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-semibold text-slate-300">{file ? file.name : 'Drop PDF here or click to browse'}</p>
              <p className="text-xs text-slate-500 mt-1">PDF files up to 25MB</p>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />

            {file && (
              <p className="mb-4 rounded-xl bg-[#10243d] px-4 py-2 text-sm font-semibold text-slate-300 flex items-center gap-2">
                <svg className="h-4 w-4 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {file.name}
              </p>
            )}

            {uploading && (
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#071527]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#facc15] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <p className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-300">{error}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full rounded-2xl bg-[#f97316] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c] disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
