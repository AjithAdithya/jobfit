'use client'
import { useState } from 'react'
import { X, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

const FREQUENCY_OPTIONS = [
  { value: 'actively',     label: 'Actively — applying right now' },
  { value: 'occasionally', label: 'Occasionally — open to opportunities' },
  { value: 'exploring',    label: 'Exploring — just curious' },
]

export default function BetaSignupModal({ onClose }: Props) {
  const [form, setForm] = useState({
    name: '', email: '', role: '', linkedin_url: '', use_case: '', frequency: '',
  })
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-3 bg-cream border border-ink-200 rounded-md text-[15px] text-ink-900
    placeholder:text-ink-400 focus:outline-none focus:border-ink-900 transition-colors`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-cream border border-ink-900 shadow-print-xl rounded-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-ink-200">
          <div>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-1">early access</p>
            <h2 className="font-chunk text-[28px] leading-none text-ink-900">Join the beta</h2>
            <p className="text-[13px] text-ink-500 mt-1.5">Limited spots. We'll reach out if you're in.</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-crimson-500" />
            <h3 className="font-chunk text-[24px] text-ink-900">You're on the list.</h3>
            <p className="text-[15px] text-ink-600 max-w-sm">
              We've received your request and sent a confirmation to <strong>{form.email}</strong>.
              We'll be in touch if the beta program has an open spot.
            </p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-ink-900 text-cream text-[14px] font-medium rounded-md hover:bg-crimson-500 transition-colors">
              close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">Full name *</label>
                <input required value={form.name} onChange={set('name')} placeholder="Ada Lovelace" className={inputCls} />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="ada@example.com" className={inputCls} />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">Current role / title *</label>
              <input required value={form.role} onChange={set('role')} placeholder="Senior Engineer at Acme" className={inputCls} />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">LinkedIn profile <span className="normal-case text-ink-400">(optional)</span></label>
              <input type="url" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/yourname" className={inputCls} />
            </div>

            {/* Frequency */}
            <div>
              <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">How often are you job hunting? *</label>
              <select required value={form.frequency} onChange={set('frequency')} className={inputCls}>
                <option value="" disabled>select one…</option>
                {FREQUENCY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Use case */}
            <div>
              <label className="block font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1.5">How would you use JobFit? *</label>
              <textarea
                required
                value={form.use_case}
                onChange={set('use_case')}
                placeholder="I spend hours tailoring resumes for each application and…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && (
              <p className="text-[13px] text-crimson-500 bg-crimson-50 border border-crimson-100 px-3 py-2 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-ink-900 text-cream font-medium text-[15px] rounded-md hover:bg-crimson-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>request access <ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="text-[11px] text-ink-400 text-center">No spam. Just a yes or no when the beta opens.</p>
          </form>
        )}
      </div>
    </div>
  )
}
