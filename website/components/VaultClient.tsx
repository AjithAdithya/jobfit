'use client'
import { useState, useRef } from 'react'
import { Upload, Trash2, FileText } from 'lucide-react'

interface UploadedResume {
  id: string
  file_name: string
  created_at: string
}

interface Props {
  uploaded: UploadedResume[]
}

export default function VaultClient({ uploaded: initialUploaded }: Props) {
  const [uploaded, setUploaded] = useState(initialUploaded)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/resume/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUploaded(prev => [{ id: data.id, file_name: data.file_name, created_at: data.created_at }, ...prev])
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resume and all its stored chunks?')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/resume/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setUploaded(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-12">

      {/* Uploaded resumes */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-1">№ 01</p>
            <h2 className="font-chunk text-2xl text-ink-900">uploaded</h2>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 text-cream text-[14px] rounded-md hover:bg-crimson-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'processing…' : 'upload pdf'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
          />
        </div>

        {uploadError && (
          <p className="mb-4 text-[13px] text-flare bg-flare/5 border border-flare/20 rounded-lg px-4 py-3">
            {uploadError}
          </p>
        )}

        {uploading && (
          <div className="mb-4 border border-ink-200 rounded-xl px-5 py-4 flex items-center gap-3 text-ink-500 text-[14px]">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse shrink-0" />
            parsing PDF, generating embeddings…
          </div>
        )}

        {uploaded.length === 0 && !uploading ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border border-dashed border-ink-300 rounded-xl p-12 text-center hover:border-ink-500 transition-colors group"
          >
            <Upload className="w-6 h-6 text-ink-300 group-hover:text-ink-500 mx-auto mb-3 transition-colors" />
            <p className="text-[15px] text-ink-400 group-hover:text-ink-600 transition-colors">drop a PDF resume here or click to upload</p>
            <p className="text-[12px] text-ink-300 mt-1">max 5 MB · text-based PDFs only</p>
          </button>
        ) : (
          <div className="divide-y divide-ink-100 border border-ink-200 rounded-xl overflow-hidden">
            {uploaded.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50 transition-colors group">
                <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-ink-900 truncate">{r.file_name}</p>
                  <p className="text-[12px] text-ink-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink-300 hover:text-flare disabled:opacity-50"
                  aria-label="Delete resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
