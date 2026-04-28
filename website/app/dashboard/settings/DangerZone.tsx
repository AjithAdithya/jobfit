'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertTriangle } from 'lucide-react'

type Modal = 'data' | 'account' | null

export default function DangerZone() {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataDeleted, setDataDeleted] = useState(false)

  function open(m: Modal) {
    setModal(m)
    setConfirmText('')
    setError(null)
  }

  function close() {
    if (loading) return
    setModal(null)
    setConfirmText('')
    setError(null)
  }

  async function handleDeleteData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/data', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Deletion failed')
      }
      setDataDeleted(true)
      setModal(null)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Deletion failed')
      }
      // Sign out client-side and redirect home
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <>
      <section className="border border-red-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <h2 className="text-[13px] font-medium text-red-700 uppercase tracking-widest">Danger zone</h2>
        </div>

        <div className="divide-y divide-red-100">
          {/* Delete data */}
          <div className="px-6 py-5 flex items-start justify-between gap-6">
            <div>
              <p className="text-[15px] font-medium text-ink-900">Delete all data</p>
              <p className="text-[13px] text-ink-500 mt-1">
                Permanently removes all job analyses, resumes, and resume chunks. Your account remains active.
              </p>
              {dataDeleted && (
                <p className="text-[13px] text-green-600 mt-2 font-medium">All data deleted.</p>
              )}
            </div>
            <button
              onClick={() => open('data')}
              className="shrink-0 px-4 py-2 text-[13px] font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete data
            </button>
          </div>

          {/* Delete account */}
          <div className="px-6 py-5 flex items-start justify-between gap-6">
            <div>
              <p className="text-[15px] font-medium text-ink-900">Delete account</p>
              <p className="text-[13px] text-ink-500 mt-1">
                Permanently deletes all data and your account. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => open('account')}
              className="shrink-0 px-4 py-2 text-[13px] font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* Modal backdrop */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="w-full max-w-md bg-cream rounded-2xl shadow-xl overflow-hidden">
            {modal === 'data' ? (
              <>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <h3 className="text-[17px] font-medium text-ink-900">Delete all data?</h3>
                  </div>
                  <p className="text-[14px] text-ink-600 leading-relaxed">
                    This will permanently delete all your job analyses, uploaded resumes, and resume chunks.
                    Your account will remain active and you can upload new resumes afterwards.
                  </p>
                  {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
                </div>
                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                  <button
                    onClick={close}
                    disabled={loading}
                    className="px-4 py-2 text-[14px] text-ink-600 hover:text-ink-900 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Yes, delete all data
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <h3 className="text-[17px] font-medium text-ink-900">Delete account?</h3>
                  </div>
                  <p className="text-[14px] text-ink-600 leading-relaxed mb-4">
                    This permanently deletes all your data and your account.
                    You will be signed out and cannot recover it.
                  </p>
                  <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                    Type <span className="font-mono text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full px-3 py-2.5 text-[14px] border border-ink-300 rounded-lg bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent font-mono"
                  />
                  {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
                </div>
                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                  <button
                    onClick={close}
                    disabled={loading}
                    className="px-4 py-2 text-[14px] text-ink-600 hover:text-ink-900 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || confirmText !== 'DELETE'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Delete my account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
