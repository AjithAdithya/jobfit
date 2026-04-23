import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Settings as SettingsIcon, Loader2, ArrowRight,
  CheckCircle2, AlertCircle, LayoutGrid, Upload, Check,
  Brain, Target, Zap, Home, Briefcase, Download, FileText,
  Mail, Palette, AlertTriangle, ClipboardPaste, ChevronDown,
} from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useResumes } from './hooks/useResumes'
import {
  runJobMatchAnalysis, generateTailoredResume,
  runPlannerSync,
} from './lib/agents'
import { applyStyleAndFitA4 } from './lib/styleUtils'
import { getMatchLevel } from './lib/matchLevel'
import { supabase } from './lib/supabase'
import type { AnalysisResult } from './lib/agents'
import { useUIStore } from './store/useUIStore'
import type { ResumeStyle } from './lib/types'
import { DEFAULT_RESUME_STYLE } from './lib/types'

// Components
import MatchCircle from './components/MatchCircle'
import ResumeManager from './components/ResumeManager'
import SettingsView from './components/Settings'
import MatchHistory from './components/MatchHistory'
import CoverLetter from './components/CoverLetter'
import StylePresets from './components/StylePresets'
import { hasDriveAccess, createGoogleDoc, DriveAuthError } from './lib/gdrive'

const SidePanel: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
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
  const [activeStyle, setActiveStyle] = useState<ResumeStyle>(DEFAULT_RESUME_STYLE)
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
        })
        setView('analysis')
        await performAnalysis(response.data.content)
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

  const performAnalysis = async (content: string) => {
    setAnalyzing(true)
    setGeneratedResume(null)
    setSelectedGaps([])
    setSelectedKeywords([])
    try {
      const result = await runJobMatchAnalysis(content)
      setAnalysis(result)

      if (result.guardrailResult?.flagged) {
        setWarning(`Security notice: ${result.guardrailResult.flagReasons.slice(0, 2).join('; ')}`)
      }

      // Auto-save to history
      if (user && activeResumeId && jobContext) {
        const { data, error } = await supabase.from('analysis_history').insert({
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
        }).select().single()
        if (!error && data) {
          useUIStore.getState().setActiveHistory(data)
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err)
      setError('Analysis failed: ' + (err.message || 'Check your API keys'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateResume = async () => {
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

      const { html: generated, guardianResult } = await generateTailoredResume(
        jobContext,
        selectedGaps,
        selectedKeywords,
        fullContext
      )

      if (guardianResult && !guardianResult.safe) {
        const highViolations = guardianResult.violations.filter(v => v.confidence === 'HIGH')
        if (highViolations.length > 0) {
          setWarning(`AI quality check flagged potential issues. Review the resume carefully before using.`)
        }
      }

      const styledHtml = applyStyleAndFitA4(generated, activeStyle)
      setGeneratedResume(styledHtml)

      // Auto-save to history
      const { activeHistoryItem: histItem } = useUIStore.getState()
      if (histItem?.id) {
        await supabase.from('analysis_history').update({
          generated_resume: styledHtml,
          updated_at: new Date().toISOString(),
        }).eq('id', histItem.id)
      }
    } catch (err: any) {
      console.error('Generation error:', err)
      setError('Failed to generate resume: ' + (err.message || String(err)))
    } finally {
      setGeneratingResume(false)
    }
  }

  const handleDownloadDocx = () => {
    if (!generatedResume) return
    // Word-specific @page + WordSection1 controls page size and margins.
    // All typography comes from the inline styles baked in by applyStyleToResumeHTML.
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Resume</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size: 8.5in 11.0in; margin: 0.4in 0.4in 0.4in 0.4in; mso-page-orientation: portrait; }
div.WordSection1 { page: WordSection1; }
</style>
</head>
<body><div class='WordSection1'>`
    const footer = "</div></body></html>"
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + generatedResume + footer)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.href = source
    a.download = 'JobFit_Tailored_Resume.doc'
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadPdf = () => {
    if (!generatedResume) return
    // Open in a new tab and auto-print. Only @page rules and print-scaling overrides
    // are defined here — all typography (font, color, size) stays on the inline styles
    // that applyStyleToResumeHTML baked into the HTML so the preview is preserved.
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JobFit Resume</title>
  <style>
    @page { size: letter; margin: 0.4in; }
    html, body { margin: 0; padding: 0; background: #fff; }
    /* Shrink the preview container's enforced max-width for print so body margin controls layout */
    .jobfit-resume { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    @media print {
      html, body { width: 7.7in; }
      .jobfit-resume { page-break-inside: avoid; }
      /* Hide any content that overflows one page */
      .jobfit-resume > *:nth-child(n) { break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${generatedResume}
  <script>window.onload=function(){window.print()}<\/script>
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm text-slate-400 animate-pulse font-medium">JobFit AI is warming up...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-[#020617] text-slate-100 p-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-20 rounded-full"></div>
            <div className="relative p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] shadow-2xl shadow-blue-500/20">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight leading-none">
              JobFit <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-slate-400 max-w-[260px] mx-auto text-base font-medium leading-relaxed">
              Your elite AI agent for job hunting. Tailor in seconds, match with precision.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full max-w-[280px] flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-100 py-4 px-6 rounded-2xl font-black transition-all transform active:scale-[0.98] shadow-2xl shadow-white/5"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between z-20 glass border-none rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase italic text-white">JobFit</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/20"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
          <button
            onClick={() => setView(currentView === 'settings' ? 'dashboard' : 'settings')}
            className={`p-2 rounded-xl transition-all ${currentView === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative">
        <AnimatePresence mode="wait">

          {/* ── Dashboard ────────────────────────────────────────────── */}
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Ready to Extract</span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight text-white">Match against any job in one click.</h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Navigate to LinkedIn or Indeed and we'll automatically pull the requirements.
                  </p>
                </div>
              </div>

              {!activeResumeId && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-300">No resume uploaded</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5">Upload a resume in the Vault before analyzing jobs.</p>
                  </div>
                  <button
                    onClick={() => setView('resumes')}
                    className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                  >
                    Upload
                  </button>
                </div>
              )}

              <button
                onClick={handleReadPage}
                disabled={!activeResumeId || loading || resumeProcessing}
                className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-3xl transition-all shadow-2xl shadow-blue-500/10 active:scale-95 group"
              >
                <div className="flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Brain className="w-6 h-6 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white text-lg leading-tight">Analyze Page</p>
                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest opacity-70">Semantic Extraction</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
              </button>

              {/* Paste-box toggle */}
              <button
                onClick={() => setPasteMode(!pasteMode)}
                disabled={!activeResumeId}
                className="w-full text-xs font-bold text-slate-500 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-1 flex items-center justify-center gap-2"
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
                      className="w-full h-40 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 font-medium resize-none focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600 custom-scrollbar"
                    />
                    <button
                      onClick={handleAnalyzePastedJD}
                      disabled={!activeResumeId || !pastedJD.trim() || loading || resumeProcessing}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                    >
                      <Brain className="w-4 h-4" />
                      Analyze Pasted JD
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4">
                <input type="file" ref={fileInputRef} onChange={handleResumeUpload} accept=".pdf" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={resumeProcessing}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all group flex flex-col items-center gap-3"
                >
                  <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors">
                    {resumeProcessing ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-slate-400 group-hover:text-white" />}
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Resumes</span>
                </button>
                <button
                  onClick={() => setView('history')}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all group flex flex-col items-center gap-3"
                >
                  <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors">
                    <LayoutGrid className="w-5 h-5 text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-white uppercase tracking-widest">History</span>
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Analysis ─────────────────────────────────────────────── */}
          {currentView === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView('dashboard')}
                  className="text-xs font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/10">
                  AI Live
                </span>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              {warning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{warning}</p>
                </motion.div>
              )}

              {analyzing ? (
                <div className="py-20 flex flex-col items-center text-center space-y-8 animate-pulse text-white">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20"></div>
                    <Brain className="w-20 h-20 text-blue-500 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2">Analyzing Fit...</h3>
                    <p className="text-slate-500 text-sm font-medium">Matching your elite segments to JD requirements.</p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-6 pb-10">
                  {jobContext && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-left">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold truncate">{activeResumeName || 'Unknown Resume'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-white">
                        <Target className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold leading-snug">{jobContext.title}</span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const level = getMatchLevel(analysis.score)
                    return (
                      <div className={`p-8 bg-gradient-to-br ${level.cardBg} border ${level.cardBorder} rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden`}>
                        <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${level.glowClass} rounded-full blur-[80px] opacity-10`} />
                        <div className="relative z-10 text-white">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Job Compatibility</p>
                          <h2 className={`text-3xl font-black ${level.textClass}`}>{level.label}</h2>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">{level.subtitle}</p>
                        </div>
                        <MatchCircle score={analysis.score} />
                      </div>
                    )
                  })()}

                  <div className="space-y-4">
                    {/* Strengths — collapsible */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                      <button
                        onClick={() => toggleSection('matches')}
                        className="w-full p-5 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
                      >
                        <h3 className="flex items-center gap-3 text-sm font-black text-emerald-400 uppercase tracking-widest">
                          <Target className="w-5 h-5" /> Matching Strengths
                          <span className="text-slate-500 font-black">
                            <span className="text-2xl text-emerald-400 leading-none">{(analysis?.matches || []).length}</span>
                            <span className="text-xs text-slate-600 mx-1">/</span>
                            <span className="text-base text-slate-500 leading-none">{(analysis?.matches || []).length + (analysis?.gaps || []).length}</span>
                          </span>
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${activeSection === 'matches' ? 'rotate-180' : ''}`}
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
                            <div className="px-5 pb-5 space-y-3">
                              {(analysis?.matches || []).map((m, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{m}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Gaps — collapsible */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                      <button
                        onClick={() => toggleSection('gaps')}
                        className="w-full p-5 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
                      >
                        <h3 className="flex items-center gap-3 text-sm font-black text-blue-400 uppercase tracking-widest">
                          <Zap className="w-5 h-5" /> Recommended Gaps
                          <span className="text-[10px] text-slate-500 font-bold">
                            ({selectedGaps.length}/{(analysis?.gaps || []).length})
                          </span>
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${activeSection === 'gaps' ? 'rotate-180' : ''}`}
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
                            <div className="px-5 pb-5 space-y-3">
                              {(analysis?.gaps || []).map((g, i) => (
                                <label key={i} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 cursor-pointer hover:bg-slate-900 transition-colors">
                                  <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
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
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{g}</p>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Keywords — collapsible */}
                    {(analysis?.keywords || []).length > 0 && (
                      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                        <button
                          onClick={() => toggleSection('keywords')}
                          className="w-full p-5 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
                        >
                          <h3 className="flex items-center gap-3 text-sm font-black text-amber-400 uppercase tracking-widest">
                            <Sparkles className="w-5 h-5" /> Target Keywords
                            <span className="text-[10px] text-slate-500 font-bold">
                              ({selectedKeywords.length}/{(analysis?.keywords || []).length})
                            </span>
                          </h3>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform ${activeSection === 'keywords' ? 'rotate-180' : ''}`}
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
                              <div className="px-5 pb-5 flex flex-wrap gap-2">
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
                                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                                        active
                                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                          : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-amber-500/30 hover:text-slate-300'
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
                      className="w-full text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 flex items-center justify-center gap-2"
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
                        <StylePresets onStyleApplied={style => setActiveStyle(style)} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate Resume button */}
                  {(plannerIntent === 'tailor_resume') && !generatedResume && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onClick={handleGenerateResume}
                      disabled={generatingResume}
                      className="w-full mt-6 flex items-center justify-center gap-3 p-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20 active:scale-95"
                    >
                      {generatingResume ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate Tailored Resume
                    </motion.button>
                  )}

                  {/* Cover Letter button */}
                  {analysis && !generatingResume && (
                    <button
                      onClick={() => setView('cover_letter')}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-700 transition-all active:scale-95"
                    >
                      <Mail className="w-5 h-5" />
                      Write Cover Letter
                    </button>
                  )}

                  {/* Generated Resume */}
                  {generatedResume && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-4"
                    >
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Tailored Resume Generated
                      </h3>

                      <div className="bg-white rounded-xl shadow-inner max-h-[500px] overflow-y-auto">
                        <div
                          className="html-resume-preview"
                          style={{ colorScheme: 'light' }}
                          dangerouslySetInnerHTML={{ __html: generatedResume }}
                        />
                      </div>

                      {driveError && (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2 text-amber-400 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>{driveError}</p>
                        </div>
                      )}
                      <div className={`grid gap-3 mt-4 ${driveConnected ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <button
                          onClick={handleDownloadDocx}
                          className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                          <FileText className="w-5 h-5" />
                          DOCX
                        </button>
                        <button
                          onClick={handleDownloadPdf}
                          className="flex items-center justify-center gap-2 p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                        >
                          <Download className="w-5 h-5" />
                          PDF
                        </button>
                        {driveConnected && (
                          <button
                            onClick={handleOpenInDrive}
                            className="flex items-center justify-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                          >
                            <Mail className="w-5 h-5" />
                            Drive
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleGenerateResume}
                        className="w-full text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        Regenerate Tailored Resume
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : !error && (
                <div className="py-20 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Target className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">No Analysis Yet</h3>
                    <p className="text-slate-500 text-sm max-w-[200px] mx-auto font-medium">Go home and click "Analyze Page" on a job description to see results here.</p>
                  </div>
                  <button
                    onClick={() => setView('dashboard')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
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
      <nav className="p-4 bg-[#020617] border-t border-slate-800/50 z-20 shadow-[0_-10px_20px_rgba(2,6,23,0.8)]">
        <div className="max-w-md mx-auto bg-slate-900 border border-white/5 rounded-3xl p-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setView('dashboard')}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Home</span>
          </button>
          <button
            onClick={() => setView('resumes')}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${currentView === 'resumes' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Vault</span>
          </button>
          <button
            onClick={() => { if (analysis || analyzing) setView('analysis') }}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${currentView === 'analysis' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'} ${(!analysis && !analyzing) ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Match</span>
          </button>
          <button
            onClick={() => { if (analysis) setView('cover_letter') }}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${currentView === 'cover_letter' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'} ${!analysis ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Mail className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Letter</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default SidePanel
