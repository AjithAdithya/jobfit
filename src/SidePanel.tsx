import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Settings as SettingsIcon, Loader2, ArrowRight,
  CheckCircle2, AlertCircle, LayoutGrid, Upload, Check,
  Brain, Target, Zap, Home, Briefcase, Download, FileText,
  Mail, Palette, AlertTriangle, ClipboardPaste, ChevronDown, X, LogOut,
} from 'lucide-react'
import LatexPreview from './components/LatexPreview'
import { useAuth } from './hooks/useAuth'
import { useResumes } from './hooks/useResumes'
import {
  runJobMatchAnalysis, generateTailoredResume,
  runPlannerSync,
} from './lib/agents'
import { getMatchLevel } from './lib/matchLevel'
import { supabase } from './lib/supabase'
import type { AnalysisResult } from './lib/agents'
import { useUIStore } from './store/useUIStore'
import type { ResumeStyle } from './lib/types'

// Components
import MatchCircle from './components/MatchCircle'
import ResumeManager from './components/ResumeManager'
import SettingsView from './components/Settings'
import MatchHistory from './components/MatchHistory'
import CoverLetter from './components/CoverLetter'
import StylePresets from './components/StylePresets'
import { hasDriveAccess, createGoogleDoc, DriveAuthError } from './lib/gdrive'
import { MissingApiKeyError } from './lib/anthropic'

const Alert: React.FC<{
  message: string
  icon?: React.ReactNode
  onDismiss: () => void
}> = ({ message, icon, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 10000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="relative overflow-hidden border border-flare/30 bg-flare/10"
    >
      <div className="flex items-start gap-2.5 p-3 pr-8">
        <span className="shrink-0 mt-0.5 text-flare">{icon ?? <AlertCircle className="w-3.5 h-3.5" />}</span>
        <p className="text-[11px] text-flare leading-snug line-clamp-3 font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-flare/50 hover:text-flare transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-flare/15">
        <motion.div
          className="h-full bg-flare/50"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 10, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

const SidePanel: React.FC = () => {
  const { user, loading: authLoading, signingIn, authError, clearAuthError, getRedirectUri, signInWithGoogle, signOut } = useAuth()
  const { uploadAndProcess, processing: resumeProcessing } = useResumes()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [selectedGaps, setSelectedGaps] = useState<string[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [generatingResume, setGeneratingResume] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<string | null>(null)
  const [regenerateNote, setRegenerateNote] = useState('')
  const [showStylePresets, setShowStylePresets] = useState(false)
  const [activeSection, setActiveSection] = useState<'matches' | 'gaps' | 'keywords' | null>(null)
  const toggleSection = (key: 'matches' | 'gaps' | 'keywords') =>
    setActiveSection(prev => prev === key ? null : key)
  const [resumeContext, setResumeContext] = useState<string>('')

  const [driveConnected, setDriveConnected] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)

  // Paste-box state
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedJD, setPastedJD] = useState('')

  const {
    currentView, setView, jobContext, setJobContext,
    activeResumeId, activeResumeName, setActiveResume,
    activeHistoryItem, setActiveHistory,
  } = useUIStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = user?.user_metadata?.full_name as string | undefined
  const userInitial = (user?.email ?? '?')[0].toUpperCase()

  React.useEffect(() => {
    if (!profileMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!profileMenuRef.current?.contains(e.target as Node)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileMenuOpen])

  React.useEffect(() => {
    hasDriveAccess().then(setDriveConnected);
  }, [user])

  React.useEffect(() => {
    if (currentView === 'analysis' && activeHistoryItem) {
      setAnalysis({
        score: activeHistoryItem.score,
        matches: activeHistoryItem.matches || [],
        gaps: activeHistoryItem.gaps || [],
        keywords: activeHistoryItem.keywords || [],
      })
      setSelectedGaps(activeHistoryItem.selected_gaps || [])
      setSelectedKeywords(activeHistoryItem.selected_keywords || [])
      setGeneratedResume(activeHistoryItem.generated_resume || null)
    }
  }, [currentView, activeHistoryItem])

  // On login, always land on the dashboard
  const prevUserRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (user && prevUserRef.current === null) {
      setView('dashboard')
    }
    prevUserRef.current = user?.id ?? null
  }, [user])

  React.useEffect(() => {
    if (user && !activeResumeId) {
      supabase.from('resumes')
        .select('id, file_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setActiveResume(data[0].id, data[0].file_name)
          }
        })
    }
  }, [user, activeResumeId, setActiveResume])

  const handleReadPage = async () => {
    setLoading(true)
    setError(null)
    setWarning(null)
    setSuccessMsg(null)
    setAnalysis(null)
    setActiveHistory(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('No active tab found')

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JD' })

      if (response && response.success) {
        setJobContext({
          title: response.data.title,
          url: response.data.url,
          siteName: response.data.siteName,
          companyName: response.data.companyName || '',
        })
        const succeeded = await performAnalysis(response.data.content)
        if (succeeded) setView('analysis')
      } else {
        setError(response?.error || 'Failed to extract content')
      }
    } catch (err) {
      console.error('Error reading page:', err)
      setError('Extension context invalidated. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzePastedJD = async () => {
    if (!pastedJD.trim()) return
    setLoading(true)
    setError(null)
    setWarning(null)
    setAnalysis(null)
    setActiveHistory(null)
    setJobContext({ title: 'Pasted Job Description', url: 'manual', siteName: 'Manual Input' })
    setView('analysis')
    await performAnalysis(pastedJD.trim())
    setLoading(false)
  }

  const goToSettings = () => {
    setView('settings')
    setWarning('Add your Anthropic API key in Settings to get started.')
  }

  const performAnalysis = async (content: string): Promise<boolean> => {
    setAnalyzing(true)
    setGeneratedResume(null)
    setSelectedGaps([])
    setSelectedKeywords([])
    try {
      const result = await runJobMatchAnalysis(content)
      setAnalysis(result)

      if (result.notJDWarning) {
        setWarning(`This page may not be a job description — ${result.notJDWarning}`)
      } else if (result.guardrailResult?.truncated) {
        setWarning('Job description exceeded 20,000 characters and was trimmed. Core content is preserved.')
      } else if (result.guardrailResult?.flagged) {
        setWarning(`Security notice: ${result.guardrailResult.flagReasons.slice(0, 2).join('; ')}`)
      }

      // Auto-save to history — upsert on URL so each job gets one row (latest wins)
      if (user && activeResumeId && jobContext) {
        const payload = {
          user_id: user.id,
          resume_id: activeResumeId,
          job_title: jobContext.title,
          job_url: jobContext.url,
          site_name: jobContext.siteName || 'Unknown',
          score: result.score,
          matches: result.matches,
          gaps: result.gaps,
          keywords: result.keywords,
          jd_text: content,
          status: 'Evaluating',
        }

        let saved: any = null
        const isRealUrl = jobContext.url && jobContext.url !== 'manual'

        if (isRealUrl) {
          // Check for an existing row for this user + URL
          const { data: existing } = await supabase
            .from('analysis_history')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('job_url', jobContext.url)
            .maybeSingle()

          if (existing) {
            const { data } = await supabase
              .from('analysis_history')
              .update({ ...payload, status: existing.status ?? 'Evaluating' })
              .eq('id', existing.id)
              .select()
              .single()
            saved = data
          } else {
            const { data } = await supabase
              .from('analysis_history')
              .insert(payload)
              .select()
              .single()
            saved = data
          }
        } else {
          const { data } = await supabase
            .from('analysis_history')
            .insert(payload)
            .select()
            .single()
          saved = data
        }

        if (saved) useUIStore.getState().setActiveHistory(saved)
      }
      return true
    } catch (err: any) {
      if (err instanceof MissingApiKeyError) { goToSettings(); return false }
      console.error('Analysis error:', err)
      setError('Analysis failed: ' + (err.message || 'Check your API keys'))
      return false
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateResume = async (feedback?: string) => {
    if (!jobContext || !activeResumeId) return

    setGeneratingResume(true)
    setError(null)
    setWarning(null)
    try {
      // Fetch full resume context
      const { data, error } = await supabase
        .from('resume_chunkies')
        .select('content')
        .eq('resume_id', activeResumeId)

      if (error) throw error
      const fullContext = data.map(d => d.content).join('\n\n')
      setResumeContext(fullContext)

      const { latex: generated, guardianResult } = await generateTailoredResume(
        jobContext,
        selectedGaps,
        selectedKeywords,
        fullContext,
        feedback
      )

      if (guardianResult && !guardianResult.safe) {
        const highViolations = guardianResult.violations.filter(v => v.confidence === 'HIGH')
        if (highViolations.length > 0) {
          setWarning(`AI quality check flagged potential issues. Review the resume carefully before using.`)
        }
      }

      setGeneratedResume(generated)

      // Auto-save to history
      const { activeHistoryItem: histItem } = useUIStore.getState()
      if (histItem?.id) {
        await supabase.from('analysis_history').update({
          generated_resume: generated,
          updated_at: new Date().toISOString(),
        }).eq('id', histItem.id)
      }
    } catch (err: any) {
      if (err instanceof MissingApiKeyError) { goToSettings(); return }
      console.error('Generation error:', err)
      setError('Failed to generate resume: ' + (err.message || String(err)))
    } finally {
      setGeneratingResume(false)
    }
  }

  const handleDownloadTex = () => {
    if (!generatedResume) return
    const blob = new Blob([generatedResume], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'JobFit_Resume.tex'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    if (!generatedResume) return
    const escaped = JSON.stringify(generatedResume)
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JobFit Resume</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/css/base.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/css/article.css">
  <style>@page { size: letter; margin: 0; } @media print { html, body { margin: 0; } .page { box-shadow: none !important; } }</style>
</head>
<body>
<script type="module">
  import { HtmlGenerator, parse } from 'https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/latex.mjs'
  const source = ${escaped}
  const generator = new HtmlGenerator({ hyphenate: false })
  parse(source, { generator })
  document.body.innerHTML = ''
  document.body.appendChild(generator.domFragment())
  window.onload = function() { window.print() }
<\/script>
</body>
</html>`
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
    chrome.tabs.create({ url })
  }

  const handleOpenInDrive = async () => {
    if (!generatedResume || !jobContext) return
    setDriveError(null)
    try {
      await createGoogleDoc(generatedResume, jobContext.title)
    } catch (err: any) {
      if (err instanceof DriveAuthError) {
        setDriveConnected(false)
        setDriveError('Google Drive access expired. Sign out and sign in again.')
      } else {
        setDriveError(err.message || 'Failed to open in Google Drive')
      }
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccessMsg(null)
    try {
      await uploadAndProcess(file)
      setSuccessMsg(`Processed ${file.name}`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to process resume')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const plannerIntent = runPlannerSync({
    hasExistingAnalysis: !!analysis,
    hasSelectedGaps: selectedGaps.length > 0,
    hasSelectedKeywords: selectedKeywords.length > 0,
  })

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-cream text-ink-900">
        <Loader2 className="w-8 h-8 animate-spin text-crimson-500 mb-4" />
        <p className="text-sm text-ink-500 animate-pulse">JobFit AI is warming up...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-cream text-ink-900 p-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <img src="/icon128.png" alt="JobFit" className="w-20 h-20" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="font-chunk text-[52px] leading-none tracking-tight">
              Job<span className="serif-accent text-crimson-500">Fit</span>
            </h1>
            <p className="text-ink-500 max-w-[260px] mx-auto text-sm leading-relaxed">
              Your AI agent for job hunting. Tailor in seconds, match with precision.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full max-w-[280px] flex items-center justify-center gap-3 bg-ink-900 text-cream hover:bg-ink-700 disabled:opacity-60 disabled:cursor-not-allowed py-4 px-6 font-bold transition-all active:scale-[0.98] shadow-print-sm border border-ink-900"
          >
            {signingIn ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {signingIn ? 'Signing in…' : 'Sign in with Google'}
          </button>

          {authError && (
            <div className="w-full max-w-[320px] mt-2 space-y-2">
              <div className="bg-crimson-50 border border-crimson-200 rounded p-3 text-xs text-crimson-700 text-left">
                <p className="font-bold mb-1">Sign-in failed</p>
                <p className="whitespace-pre-wrap break-words">{authError}</p>
                <button onClick={clearAuthError} className="mt-2 text-crimson-500 underline text-[11px]">Dismiss</button>
              </div>
              {authError.includes('Redirect URL') || authError.includes('redirect URL') || authError.includes('Redirect URLs') ? (
                <div className="bg-ink-100 border border-ink-200 rounded p-3 text-xs text-ink-600 text-left">
                  <p className="font-bold text-ink-800 mb-1">Configure Supabase</p>
                  <p className="mb-1">Add this exact URL to <span className="font-mono">Auth → URL Configuration → Redirect URLs</span>:</p>
                  <div className="flex items-center gap-1">
                    <code className="flex-1 bg-ink-200 px-2 py-1 rounded text-[10px] break-all font-mono">{getRedirectUri()}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(getRedirectUri())}
                      className="shrink-0 text-ink-500 hover:text-ink-900 transition-colors"
                      title="Copy"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/></svg>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-cream text-ink-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="px-5 py-3 flex items-center justify-between z-20 bg-cream border-b border-ink-200">
        <div className="flex items-center gap-2.5">
          <img src="/icon48.png" alt="JobFit" className="w-7 h-7" />
          <h1 className="font-chunk text-lg leading-none">
            <span className="text-ink-900">Job</span><span className="text-crimson-500">fit</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-citrus/40 text-ink-900 p-2 border border-ink-200"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(v => !v)}
              className="rounded-full ring-2 ring-transparent hover:ring-ink-300 transition-all"
              aria-label="Profile menu"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="profile" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ink-900 flex items-center justify-center font-chunk text-cream text-sm select-none">
                  {userInitial}
                </div>
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-cream border border-ink-200 shadow-print-md z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-ink-100">
                  {fullName && <p className="text-[12px] font-medium text-ink-900 truncate">{fullName}</p>}
                  <p className="text-[11px] text-ink-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setView('settings'); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50 transition-colors text-left"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-ink-400" />
                  Settings
                </button>
                <button
                  onClick={() => { signOut(); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50 transition-colors text-left border-t border-ink-100"
                >
                  <LogOut className="w-3.5 h-3.5 text-ink-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar relative">
        <AnimatePresence mode="wait">

          {/* ── Dashboard ────────────────────────────────────────────── */}
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              {/* Hero card — compact */}
              <div className="px-4 py-3 bg-ink-900 border border-ink-900 relative overflow-hidden group">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-crimson-500 rounded-full blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-1.5 bg-white/10 shrink-0">
                    <Zap className="w-4 h-4 text-citrus" />
                  </div>
                  <div>
                    <h2 className="font-chunk text-[15px] leading-tight text-cream">Match against any job in one click.</h2>
                    <p className="text-[10px] text-ink-400 mt-0.5">Navigate to LinkedIn or Indeed to auto-extract.</p>
                  </div>
                </div>
              </div>

              {!activeResumeId && (
                <div className="flex items-center gap-3 p-4 bg-flare/10 border border-flare/30">
                  <AlertTriangle className="w-4 h-4 text-flare shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-flare">No resume uploaded</p>
                    <p className="text-[10px] text-flare/70 mt-0.5">Upload a resume in the Vault before analyzing jobs.</p>
                  </div>
                  <button
                    onClick={() => setView('resumes')}
                    className="shrink-0 px-3 py-1.5 bg-flare hover:bg-flare/80 text-cream text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    Upload
                  </button>
                </div>
              )}

              <button
                onClick={handleReadPage}
                disabled={!activeResumeId || loading || resumeProcessing}
                className="w-full flex items-center justify-between p-5 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-40 disabled:cursor-not-allowed border border-crimson-600 transition-all shadow-print-sm active:scale-95 group"
              >
                <div className="flex items-center gap-4 text-cream">
                  <div className="w-12 h-12 bg-crimson-600/40 flex items-center justify-center">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-cream" /> : <Brain className="w-6 h-6 text-cream" />}
                  </div>
                  <div className="text-left">
                    <p className="font-chunk text-cream text-xl leading-tight">Analyze Page</p>
                    <p className="eyebrow text-cream/60 mt-1">Semantic Extraction</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-cream/50 group-hover:text-cream transition-colors" />
              </button>

              {/* Paste-box toggle */}
              <button
                onClick={() => setPasteMode(!pasteMode)}
                disabled={!activeResumeId}
                className="w-full text-xs font-bold text-ink-500 hover:text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-1 flex items-center justify-center gap-2"
              >
                <ClipboardPaste className="w-3 h-3" />
                {pasteMode ? 'Hide paste box' : "Can't extract? Paste the JD here"}
              </button>

              <AnimatePresence>
                {pasteMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <textarea
                      value={pastedJD}
                      onChange={e => setPastedJD(e.target.value)}
                      placeholder="Paste the full job description here..."
                      className="w-full h-40 p-4 bg-white border border-ink-200 text-xs text-ink-700 resize-none focus:outline-none focus:border-crimson-500 placeholder:text-ink-400 custom-scrollbar"
                    />
                    <button
                      onClick={handleAnalyzePastedJD}
                      disabled={!activeResumeId || !pastedJD.trim() || loading || resumeProcessing}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-40 text-cream font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
                    >
                      <Brain className="w-4 h-4" />
                      Analyze Pasted JD
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <input type="file" ref={fileInputRef} onChange={handleResumeUpload} accept=".pdf" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={resumeProcessing}
                  className="p-5 bg-white border border-ink-200 hover:border-ink-900 transition-all group flex flex-col items-center gap-3"
                >
                  <div className="p-3 bg-ink-100 group-hover:bg-crimson-500 transition-colors">
                    {resumeProcessing ? <Loader2 className="w-5 h-5 animate-spin text-crimson-500 group-hover:text-cream" /> : <Upload className="w-5 h-5 text-ink-500 group-hover:text-cream" />}
                  </div>
                  <span className="eyebrow text-ink-500 group-hover:text-ink-900 transition-colors">Resumes</span>
                </button>
                <button
                  onClick={() => setView('history')}
                  className="p-5 bg-white border border-ink-200 hover:border-ink-900 transition-all group flex flex-col items-center gap-3"
                >
                  <div className="p-3 bg-ink-100 group-hover:bg-crimson-500 transition-colors">
                    <LayoutGrid className="w-5 h-5 text-ink-500 group-hover:text-cream" />
                  </div>
                  <span className="eyebrow text-ink-500 group-hover:text-ink-900 transition-colors">Dashboard</span>
                </button>
              </div>

              <AnimatePresence>
                {error && <Alert message={error} onDismiss={() => setError(null)} />}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Analysis ─────────────────────────────────────────────── */}
          {currentView === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView('dashboard')}
                  className="text-xs font-bold text-ink-500 hover:text-ink-900 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <span className="px-3 py-1 bg-crimson-500/10 text-crimson-500 text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-crimson-500/30">
                  AI Live
                </span>
              </div>

              <AnimatePresence>
                {error && <Alert message={error} onDismiss={() => setError(null)} />}
              </AnimatePresence>
              <AnimatePresence>
                {warning && (
                  <Alert
                    message={warning}
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    onDismiss={() => setWarning(null)}
                  />
                )}
              </AnimatePresence>

              {analyzing ? (
                <div className="py-20 flex flex-col items-center text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-crimson-500 blur-[60px] opacity-20"></div>
                    <Brain className="w-20 h-20 text-crimson-500 animate-bounce relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-chunk text-2xl mb-2 text-ink-900">Analyzing Fit...</h3>
                    <p className="text-ink-500 text-sm">Matching your elite segments to JD requirements.</p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-5 pb-10">
                  {jobContext && (
                    <div className="bg-ink-50 border border-ink-200 p-4 text-left">
                      <div className="flex items-center gap-2 text-ink-500 mb-1">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span className="text-xs truncate">{activeResumeName || 'Unknown Resume'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-ink-900">
                        <Target className="w-4 h-4 shrink-0 mt-0.5 text-crimson-500" />
                        <span className="text-sm font-bold leading-snug">{jobContext.title}</span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const level = getMatchLevel(analysis.score)
                    return (
                      <div className={`p-6 ${level.cardBg} border ${level.cardBorder}`}>
                        <MatchCircle score={analysis.score} />
                      </div>
                    )
                  })()}

                  <div className="space-y-3">
                    {/* Strengths — collapsible */}
                    <div className="bg-white border border-ink-200 overflow-hidden">
                      <button
                        onClick={() => toggleSection('matches')}
                        className="w-full p-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
                      >
                        <h3 className="flex items-center gap-3 text-sm font-bold text-ink-900 uppercase tracking-widest">
                          <Target className="w-4 h-4 text-ink-500" /> Matching Strengths
                          <span className="text-ink-500 font-mono text-xs">
                            <span className="font-chunk text-xl text-ink-900 leading-none">{(analysis?.matches || []).length}</span>
                            <span className="text-ink-400 mx-1">/</span>
                            <span className="text-ink-400">{(analysis?.matches || []).length + (analysis?.gaps || []).length}</span>
                          </span>
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-ink-400 transition-transform ${activeSection === 'matches' ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {activeSection === 'matches' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 space-y-2 border-t border-ink-100">
                              {(analysis?.matches || []).map((m, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-ink-50 border border-ink-100 mt-2">
                                  <CheckCircle2 className="w-4 h-4 text-ink-700 mt-0.5 shrink-0" />
                                  <p className="text-xs text-ink-700 leading-relaxed">{m}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Gaps — collapsible */}
                    <div className="bg-white border border-ink-200 overflow-hidden">
                      <button
                        onClick={() => toggleSection('gaps')}
                        className="w-full p-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
                      >
                        <h3 className="flex items-center gap-3 text-sm font-bold text-crimson-500 uppercase tracking-widest">
                          <Zap className="w-4 h-4" /> Recommended Gaps
                          <span className="text-[10px] text-ink-500 font-bold font-mono">
                            ({selectedGaps.length}/{(analysis?.gaps || []).length})
                          </span>
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-ink-400 transition-transform ${activeSection === 'gaps' ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {activeSection === 'gaps' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 space-y-2 border-t border-ink-100">
                              {(analysis?.gaps || []).map((g, i) => (
                                <label key={i} className="flex items-start gap-3 p-3 bg-ink-50 border border-ink-100 mt-2 cursor-pointer hover:bg-white transition-colors">
                                  <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 border-ink-300 text-crimson-500 focus:ring-crimson-500 bg-white"
                                    checked={selectedGaps.includes(g)}
                                    onChange={async e => {
                                      const newGaps = e.target.checked
                                        ? [...selectedGaps, g]
                                        : selectedGaps.filter(gap => gap !== g)
                                      setSelectedGaps(newGaps)
                                      const { activeHistoryItem: h } = useUIStore.getState()
                                      if (h?.id) {
                                        await supabase.from('analysis_history').update({ selected_gaps: newGaps }).eq('id', h.id)
                                      }
                                    }}
                                  />
                                  <p className="text-xs text-ink-700 leading-relaxed">{g}</p>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Keywords — collapsible */}
                    {(analysis?.keywords || []).length > 0 && (
                      <div className="bg-white border border-ink-200 overflow-hidden">
                        <button
                          onClick={() => toggleSection('keywords')}
                          className="w-full p-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
                        >
                          <h3 className="flex items-center gap-3 text-sm font-bold text-ink-700 uppercase tracking-widest">
                            <Sparkles className="w-4 h-4" /> Target Keywords
                            <span className="text-[10px] text-ink-500 font-bold font-mono">
                              ({selectedKeywords.length}/{(analysis?.keywords || []).length})
                            </span>
                          </h3>
                          <ChevronDown
                            className={`w-4 h-4 text-ink-400 transition-transform ${activeSection === 'keywords' ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {activeSection === 'keywords' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
                                {(analysis?.keywords || []).map((k, i) => {
                                  const active = selectedKeywords.includes(k);
                                  return (
                                    <button
                                      key={i}
                                      onClick={async () => {
                                        const newKw = active
                                          ? selectedKeywords.filter(kw => kw !== k)
                                          : [...selectedKeywords, k];
                                        setSelectedKeywords(newKw);
                                        const { activeHistoryItem: h } = useUIStore.getState();
                                        if (h?.id) {
                                          await supabase.from('analysis_history').update({ selected_keywords: newKw }).eq('id', h.id);
                                        }
                                      }}
                                      className={`px-3 py-1.5 text-xs font-bold border transition-all active:scale-95 ${
                                        active
                                          ? 'bg-citrus border-ink-900 text-ink-900'
                                          : 'bg-white border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
                                      }`}
                                    >
                                      {k}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Style Presets toggle */}
                  {!generatedResume && (selectedGaps.length > 0 || selectedKeywords.length > 0) && (
                    <button
                      onClick={() => setShowStylePresets(!showStylePresets)}
                      className="w-full text-xs font-bold text-ink-500 hover:text-ink-700 transition-colors py-1 flex items-center justify-center gap-2"
                    >
                      <Palette className="w-3 h-3" />
                      {showStylePresets ? 'Hide style options' : 'Customize resume style'}
                    </button>
                  )}

                  <AnimatePresence>
                    {showStylePresets && !generatedResume && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <StylePresets onStyleApplied={(_style: ResumeStyle) => {}} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate Resume button */}
                  {(plannerIntent === 'tailor_resume') && !generatedResume && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleGenerateResume()}
                      disabled={generatingResume}
                      className="w-full mt-4 flex items-center justify-center gap-3 p-4 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-50 text-cream font-bold uppercase tracking-widest transition-all shadow-print-sm active:scale-95 border border-crimson-600"
                    >
                      {generatingResume ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate Tailored Resume
                    </motion.button>
                  )}

                  {/* Cover Letter button */}
                  {analysis && !generatingResume && (
                    <button
                      onClick={() => setView('cover_letter')}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-ink-900 hover:bg-ink-700 text-cream font-bold uppercase tracking-widest text-xs border border-ink-900 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      Write Cover Letter
                    </button>
                  )}

                  {/* Generated Resume */}
                  {generatedResume && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4"
                    >
                      <h3 className="font-chunk text-xl text-ink-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-ink-700" />
                        Tailored Resume Generated
                      </h3>

                      <div className="relative bg-white border border-ink-200 max-h-[500px] overflow-y-auto">
                        {generatingResume && (
                          <div className="absolute inset-0 bg-cream/80 flex flex-col items-center justify-center gap-3 z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-crimson-500" />
                            <p className="eyebrow text-ink-500">Regenerating…</p>
                          </div>
                        )}
                        <LatexPreview
                          source={generatedResume}
                          className="html-resume-preview"
                        />
                      </div>

                      <AnimatePresence>
                        {driveError && (
                          <Alert
                            message={driveError}
                            icon={<AlertTriangle className="w-3.5 h-3.5" />}
                            onDismiss={() => setDriveError(null)}
                          />
                        )}
                      </AnimatePresence>

                      <div className={`grid gap-3 mt-4 ${driveConnected ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <button
                          onClick={handleDownloadTex}
                          className="flex items-center justify-center gap-2 p-3 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-xs transition-all shadow-print-sm active:scale-95 border border-crimson-600"
                        >
                          <FileText className="w-4 h-4" />
                          .TEX
                        </button>
                        <button
                          onClick={handleDownloadPdf}
                          className="flex items-center justify-center gap-2 p-3 bg-ink-900 hover:bg-ink-700 text-cream font-bold uppercase tracking-widest text-xs transition-all shadow-print-sm active:scale-95 border border-ink-900"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        {driveConnected && (
                          <button
                            onClick={handleOpenInDrive}
                            className="flex items-center justify-center gap-2 p-3 bg-sky hover:bg-sky/80 text-ink-900 font-bold uppercase tracking-widest text-xs transition-all shadow-print-sm active:scale-95 border border-sky"
                          >
                            <Mail className="w-4 h-4" />
                            Drive
                          </button>
                        )}
                      </div>

                      {/* Regenerate with feedback */}
                      <div className="border border-ink-200 bg-ink-50">
                        <div className="px-4 pt-3 pb-2">
                          <p className="eyebrow text-ink-500 mb-2">Revision notes</p>
                          <textarea
                            value={regenerateNote}
                            onChange={e => setRegenerateNote(e.target.value)}
                            placeholder="e.g. Add more focus on leadership experience, shorten the summary, highlight Python skills more…"
                            rows={3}
                            className="w-full p-3 bg-white border border-ink-200 text-xs text-ink-900 resize-none focus:outline-none focus:border-crimson-500 placeholder:text-ink-400"
                          />
                        </div>
                        <button
                          onClick={() => {
                            handleGenerateResume(regenerateNote || undefined)
                            setRegenerateNote('')
                          }}
                          disabled={generatingResume}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-ink-200 text-[10px] font-bold uppercase tracking-widest text-ink-600 hover:bg-ink-900 hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {generatingResume
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating…</>
                            : <><Sparkles className="w-3 h-3" /> Regenerate Resume</>
                          }
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : !error && (
                <div className="py-20 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-cream border border-ink-200 flex items-center justify-center">
                    <Target className="w-10 h-10 text-ink-900" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-chunk text-xl">No Analysis Yet</h3>
                    <p className="text-ink-500 text-sm max-w-[200px] mx-auto">Go home and click "Analyze Page" on a job description to see results here.</p>
                  </div>
                  <button
                    onClick={() => setView('dashboard')}
                    className="px-6 py-3 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold text-xs uppercase tracking-widest shadow-print-sm active:scale-95 transition-all border border-crimson-600"
                  >
                    Go Back Home
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'resumes' && <ResumeManager />}
          {currentView === 'history' && <MatchHistory />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'cover_letter' && analysis && jobContext && (
            <CoverLetter
              analysis={analysis}
              jobContext={jobContext}
              resumeContext={resumeContext}
              selectedGaps={selectedGaps}
              selectedKeywords={selectedKeywords}
              activeResumeId={activeResumeId}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="p-3 bg-cream border-t border-ink-200 z-20">
        <div className="bg-white border border-ink-200 p-1 flex items-center justify-around">
          <button
            onClick={() => setView('dashboard')}
            className={`flex-1 flex flex-col items-center py-2.5 transition-all ${currentView === 'dashboard' ? 'bg-crimson-500 text-cream shadow-print-sm' : 'text-ink-500 hover:text-ink-900'}`}
          >
            <Home className="w-5 h-5" />
            <span className="eyebrow mt-1">Home</span>
          </button>
          <button
            onClick={() => setView('resumes')}
            className={`flex-1 flex flex-col items-center py-2.5 transition-all ${currentView === 'resumes' ? 'bg-crimson-500 text-cream shadow-print-sm' : 'text-ink-500 hover:text-ink-900'}`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="eyebrow mt-1">Vault</span>
          </button>
          <button
            onClick={() => { if (analysis || analyzing) setView('analysis') }}
            className={`flex-1 flex flex-col items-center py-2.5 transition-all ${currentView === 'analysis' ? 'bg-crimson-500 text-cream shadow-print-sm' : 'text-ink-500 hover:text-ink-900'} ${(!analysis && !analyzing) ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Target className="w-5 h-5" />
            <span className="eyebrow mt-1">Match</span>
          </button>
          <button
            onClick={() => { if (analysis) setView('cover_letter') }}
            className={`flex-1 flex flex-col items-center py-2.5 transition-all ${currentView === 'cover_letter' ? 'bg-crimson-500 text-cream shadow-print-sm' : 'text-ink-500 hover:text-ink-900'} ${!analysis ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Mail className="w-5 h-5" />
            <span className="eyebrow mt-1">Letter</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default SidePanel
