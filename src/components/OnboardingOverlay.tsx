import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Eye, EyeOff, Check, X, Loader2,
  Key, Upload, User, Sparkles,
} from 'lucide-react'
import { validateAnthropicKey, validateVoyageKey } from '../lib/keyValidator'
import type { KeyStatus } from '../lib/keyValidator'
import { useResumes } from '../hooks/useResumes'
import { supabase } from '../lib/supabase'

interface Props {
  userId: string
  onComplete: (goToProfile: boolean) => void
}

const STEPS = ['welcome', 'keys', 'resume', 'profile'] as const

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 20 : 6, opacity: i === current ? 1 : 0.3 }}
          transition={{ duration: 0.25 }}
          className="h-1.5 bg-ink-900 rounded-full"
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: KeyStatus | 'idle' | 'checking' }) {
  if (status === 'idle') return null
  if (status === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-ink-400 shrink-0" />
  if (status === 'valid') return <Check className="w-4 h-4 text-citrus shrink-0" />
  if (status === 'invalid') return <X className="w-4 h-4 text-flare shrink-0" />
  return <span className="text-[10px] text-ink-400 shrink-0">err</span>
}

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
}

export default function OnboardingOverlay({ userId, onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  // Step 2 — keys
  const [anthropicKey, setAnthropicKey] = useState('')
  const [voyageKey, setVoyageKey] = useState('')
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showVoyage, setShowVoyage] = useState(false)
  const [anthropicStatus, setAnthropicStatus] = useState<KeyStatus | 'idle' | 'checking'>('idle')
  const [voyageStatus, setVoyageStatus] = useState<KeyStatus | 'idle' | 'checking'>('idle')

  // Step 3 — resume
  const { uploadAndProcess, processing: resumeProcessing } = useResumes()
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const next = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1))

  const handleValidateAnthropic = async () => {
    if (!anthropicKey.trim()) return
    setAnthropicStatus('checking')
    const r = await validateAnthropicKey(anthropicKey.trim())
    setAnthropicStatus(r)
  }

  const handleValidateVoyage = async () => {
    if (!voyageKey.trim()) return
    setVoyageStatus('checking')
    const r = await validateVoyageKey(voyageKey.trim())
    setVoyageStatus(r)
  }

  const handleSaveAndNext = () => {
    chrome.storage.local.set({
      jobfit_anthropic_key: anthropicKey.trim(),
      jobfit_voyage_key: voyageKey.trim(),
    }, next)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      await uploadAndProcess(file)
      setUploadedName(file.name)
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    }
    e.target.value = ''
  }

  const keysValid = anthropicStatus === 'valid' && voyageStatus === 'valid'

  const inputClass = "flex-1 bg-ink-50 border border-ink-200 px-3 py-2 text-[12px] text-ink-900 placeholder-ink-400 focus:outline-none focus:border-crimson-500"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm"
    >
      <div className="w-full mx-3 bg-cream border border-ink-200 overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-ink-900">
          <span className="font-chunk text-[15px] text-cream">
            Job<span className="serif-accent text-crimson-400">fit</span>
          </span>
          <span className="text-[9px] text-ink-400 font-mono tracking-caps uppercase">
            {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 space-y-5"
              >
                <div>
                  <p className="font-mono text-[9px] text-crimson-500 tracking-caps uppercase mb-3">getting started</p>
                  <h2 className="font-chunk text-[28px] leading-none tracking-tight text-ink-900 mb-1">
                    welcome <span className="serif-accent text-crimson-500">aboard.</span>
                  </h2>
                  <p className="text-[13px] italic font-serif text-ink-500">your AI-powered job search co-pilot</p>
                </div>

                <div className="space-y-3">
                  {[
                    { num: '01', label: 'BYOK', desc: 'Bring your own Anthropic & Voyage keys. We never see them.' },
                    { num: '02', label: 'Resume', desc: 'Upload your resume once. We embed it for semantic matching.' },
                    { num: '03', label: 'Profile', desc: 'Tell us what you\'re looking for. Totally optional.' },
                  ].map(item => (
                    <div key={item.num} className="flex items-start gap-3 p-3 border border-ink-100 bg-white">
                      <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase pt-0.5 shrink-0">{item.num}</span>
                      <div>
                        <p className="font-mono text-[10px] text-ink-900 tracking-caps uppercase mb-0.5">{item.label}</p>
                        <p className="text-[11px] text-ink-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={next}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95"
                >
                  let's set up <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 'keys' && (
              <motion.div
                key="keys"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-crimson-500" />
                    <p className="font-mono text-[9px] text-crimson-500 tracking-caps uppercase">step 02 · api keys</p>
                  </div>
                  <h2 className="font-chunk text-[22px] leading-none tracking-tight text-ink-900">
                    your keys, <span className="serif-accent text-crimson-500">your control.</span>
                  </h2>
                </div>

                {/* Anthropic */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">Anthropic</label>
                    <StatusBadge status={anthropicStatus} />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type={showAnthropic ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={e => { setAnthropicKey(e.target.value); setAnthropicStatus('idle') }}
                      placeholder="sk-ant-api03-..."
                      className={inputClass}
                    />
                    <button onClick={() => setShowAnthropic(v => !v)} className="p-2 text-ink-400 hover:text-ink-700 transition-colors">
                      {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleValidateAnthropic}
                      disabled={!anthropicKey.trim() || anthropicStatus === 'checking'}
                      className="px-2.5 py-2 bg-ink-900 hover:bg-crimson-500 text-cream text-[9px] font-mono tracking-caps uppercase transition-colors disabled:opacity-40"
                    >
                      test
                    </button>
                  </div>
                </div>

                {/* Voyage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">Voyage AI</label>
                    <StatusBadge status={voyageStatus} />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type={showVoyage ? 'text' : 'password'}
                      value={voyageKey}
                      onChange={e => { setVoyageKey(e.target.value); setVoyageStatus('idle') }}
                      placeholder="pa-..."
                      className={inputClass}
                    />
                    <button onClick={() => setShowVoyage(v => !v)} className="p-2 text-ink-400 hover:text-ink-700 transition-colors">
                      {showVoyage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleValidateVoyage}
                      disabled={!voyageKey.trim() || voyageStatus === 'checking'}
                      className="px-2.5 py-2 bg-ink-900 hover:bg-crimson-500 text-cream text-[9px] font-mono tracking-caps uppercase transition-colors disabled:opacity-40"
                    >
                      test
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-ink-400 italic font-serif">
                  Stored locally in your browser. Never transmitted to our servers.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveAndNext}
                    disabled={!keysValid}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {keysValid ? <Check className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                    save & continue
                  </button>
                  <button onClick={next} className="text-[10px] font-mono text-ink-400 hover:text-ink-700 transition-colors whitespace-nowrap">
                    skip for now
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'resume' && (
              <motion.div
                key="resume"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4 text-crimson-500" />
                    <p className="font-mono text-[9px] text-crimson-500 tracking-caps uppercase">step 03 · resume</p>
                  </div>
                  <h2 className="font-chunk text-[22px] leading-none tracking-tight text-ink-900">
                    drop your <span className="serif-accent text-crimson-500">resume.</span>
                  </h2>
                  <p className="text-[12px] text-ink-500 mt-1.5 font-serif italic">
                    We embed it once for fast semantic matching against any job.
                  </p>
                </div>

                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />

                {uploadedName ? (
                  <div className="flex items-center gap-3 p-4 border border-citrus/40 bg-citrus/10">
                    <Check className="w-5 h-5 text-citrus shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-ink-900 truncate">{uploadedName}</p>
                      <p className="text-[10px] text-ink-500">Uploaded and embedded</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={resumeProcessing}
                    className="w-full flex flex-col items-center gap-3 p-6 border-2 border-dashed border-ink-200 hover:border-crimson-500 hover:bg-crimson-500/5 transition-colors disabled:opacity-50 group"
                  >
                    {resumeProcessing
                      ? <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
                      : <Upload className="w-8 h-8 text-ink-300 group-hover:text-crimson-500 transition-colors" />
                    }
                    <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase group-hover:text-crimson-500 transition-colors">
                      {resumeProcessing ? 'processing…' : 'click to upload PDF'}
                    </span>
                  </button>
                )}

                {uploadError && (
                  <p className="text-[10px] text-flare font-mono">{uploadError}</p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={next}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                  >
                    continue <ArrowRight className="w-3 h-3" />
                  </button>
                  {!uploadedName && (
                    <button onClick={next} className="text-[10px] font-mono text-ink-400 hover:text-ink-700 transition-colors whitespace-nowrap">
                      skip for now
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div
                key="profile"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-crimson-500" />
                    <p className="font-mono text-[9px] text-crimson-500 tracking-caps uppercase">step 04 · profile</p>
                  </div>
                  <h2 className="font-chunk text-[22px] leading-none tracking-tight text-ink-900">
                    tell us about <span className="serif-accent text-crimson-500">you.</span>
                  </h2>
                  <p className="text-[12px] text-ink-500 mt-1.5 font-serif italic">
                    Profile details help the AI tailor resumes with more precision. Totally optional — skip anytime.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    'Seniority level & years of experience',
                    'Target roles & industries',
                    'Location, visa status & salary range',
                    'LinkedIn, GitHub & portfolio links',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-[11px] text-ink-700">
                      <Sparkles className="w-3 h-3 text-crimson-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <button
                  onClick={async () => {
                  await supabase.from('user_profiles').upsert(
                    { user_id: userId, onboarding_completed: true },
                    { onConflict: 'user_id' }
                  )
onComplete(true)
                }}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  complete profile <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={async () => {
                  await supabase.from('user_profiles').upsert(
                    { user_id: userId, onboarding_completed: true },
                    { onConflict: 'user_id' }
                  )
onComplete(false)
                }}
                  className="w-full text-[10px] font-mono text-ink-400 hover:text-ink-700 transition-colors py-1"
                >
                  i'll do this later
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="px-6 pb-5">
          <StepDots current={stepIndex} />
        </div>
      </div>
    </motion.div>
  )
}
