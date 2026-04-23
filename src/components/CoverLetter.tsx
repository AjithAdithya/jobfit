import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Mail, Loader2, Copy, Download, Check,
  AlertCircle, Sparkles, ExternalLink,
} from 'lucide-react';
import { generateCoverLetterStream } from '../lib/agents';
import type { AnalysisResult, CoverLetterTone } from '../lib/agents';
import type { JobContext } from '../store/useUIStore';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';
import { generateEmbeddings } from '../lib/voyage';
import { searchResumeChunks } from '../lib/search';
import { hasDriveAccess, createGoogleDoc, DriveAuthError } from '../lib/gdrive';

interface CoverLetterProps {
  analysis: AnalysisResult;
  jobContext: JobContext;
  resumeContext: string;
  selectedGaps: string[];
  selectedKeywords: string[];
  activeResumeId: string | null;
}

interface ToneOption {
  value: CoverLetterTone;
  label: string;
  description: string;
}

const TONE_OPTIONS: ToneOption[] = [
  { value: 'professional', label: 'Professional', description: 'Formal & measured' },
  { value: 'warm',         label: 'Warm',         description: 'Personable & genuine' },
  { value: 'direct',       label: 'Direct',       description: 'Confident & brief' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic & passionate' },
];

// Extract company name heuristically from job title / site name
function extractCompanyName(jobContext: JobContext): string {
  if (jobContext.siteName && jobContext.siteName !== 'Manual Input' && jobContext.siteName !== 'Unknown') {
    // Site name is often company name on direct company pages (e.g. "Stripe Careers")
    return jobContext.siteName.replace(/\s*(careers?|jobs?|hiring)\s*$/i, '').trim();
  }
  // Try to pull "at CompanyName" from the title
  const atMatch = jobContext.title.match(/\s+(?:at|-|\|)\s+(.+?)(?:\s*[-|·].*)?$/i);
  if (atMatch) return atMatch[1].trim();
  return 'the company';
}

const CoverLetter: React.FC<CoverLetterProps> = ({
  analysis, jobContext, resumeContext, selectedGaps, selectedKeywords, activeResumeId,
}) => {
  const { setView, activeHistoryItem } = useUIStore();
  const [selectedTone, setSelectedTone] = useState<CoverLetterTone>('professional');
  const [generating, setGenerating] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  useEffect(() => { hasDriveAccess().then(setDriveConnected); }, []);
  const [stage, setStage] = useState<string>('');
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch the most relevant resume chunks for the user's selections
  // so the cover letter is grounded in actual resume content.
  const fetchPersonalizedContext = async (): Promise<string> => {
    setStage('Searching your resume for relevant experience...');

    // Query terms: selected gaps + keywords (what the user wants to emphasize),
    // plus the job title to pull relevant domain experience
    const queries = [
      jobContext.title,
      ...selectedGaps,
      ...selectedKeywords,
    ].filter(q => q && q.length > 2);

    if (queries.length === 0) {
      // Fallback: pull all resume chunks for this resume
      if (activeResumeId) {
        const { data } = await supabase
          .from('resume_chunkies')
          .select('content, section')
          .eq('resume_id', activeResumeId)
          .limit(15);
        if (data && data.length > 0) {
          return data.map((d: any) => `[${d.section}] ${d.content}`).join('\n\n');
        }
      }
      return resumeContext || 'No resume context available.';
    }

    try {
      const embeddings = await generateEmbeddings(queries);
      const chunks: { content: string; section: string; similarity: number }[] = [];
      const seen = new Set<string>();

      for (const embedding of embeddings) {
        const results = await searchResumeChunks(embedding, 0.3, 4);
        for (const r of results) {
          if (!seen.has(r.content)) {
            seen.add(r.content);
            chunks.push({ content: r.content, section: r.section, similarity: r.similarity });
          }
        }
      }

      // Sort by similarity, take top 10, group by section for readability
      chunks.sort((a, b) => b.similarity - a.similarity);
      const top = chunks.slice(0, 10);

      if (top.length === 0) {
        return resumeContext || 'No matching resume content found.';
      }

      return top.map(c => `[${c.section}] ${c.content}`).join('\n\n');
    } catch (err) {
      console.warn('Vector search for cover letter fell back to raw context:', err);
      return resumeContext || 'Resume context unavailable.';
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setStreamedText('');
    setError(null);

    try {
      // 1. Pull personalized context from user's resume via vector search
      const personalizedResumeContext = await fetchPersonalizedContext();

      // 2. Build a rich JD summary from selections + analysis
      const jdSummary = [
        selectedGaps.length > 0 ? `Gaps to address: ${selectedGaps.join(', ')}` : '',
        selectedKeywords.length > 0 ? `Keywords to weave in: ${selectedKeywords.join(', ')}` : '',
        analysis.matches.length > 0 ? `Requirements already aligned: ${analysis.matches.slice(0, 5).join('; ')}` : '',
      ].filter(Boolean).join('\n');

      setStage('Writing your cover letter...');

      const companyName = extractCompanyName(jobContext);

      let fullText = '';
      await generateCoverLetterStream(
        {
          resumeSummary: personalizedResumeContext,
          jdSummary,
          companyName,
          roleTitle: jobContext.title,
          tone: selectedTone,
        },
        (chunk) => {
          fullText += chunk;
          setStreamedText(prev => prev + chunk);
        }
      );

      // Persist to history
      useUIStore.getState().setCurrentCoverLetter(fullText);
      if (activeHistoryItem?.id) {
        await supabase.from('analysis_history').update({
          cover_letter: fullText,
          cover_letter_tone: selectedTone,
        }).eq('id', activeHistoryItem.id);
      }
    } catch (err: any) {
      console.error('Cover letter generation error:', err);
      setError('Failed to generate cover letter: ' + (err.message || String(err)));
    } finally {
      setGenerating(false);
      setStage('');
    }
  };

  const handleCopy = async () => {
    if (!streamedText) return;
    await navigator.clipboard.writeText(streamedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDocx = () => {
    if (!streamedText) return;
    // Convert plain text → paragraphs with styled inline formatting
    const paragraphs = streamedText
      .split(/\n{2,}/)
      .map(p => `<p style="margin: 0 0 12pt 0; font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; color: #000;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Cover Letter</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size: 8.5in 11.0in; margin: 1.0in 1.0in 1.0in 1.0in; }
div.WordSection1 { page: WordSection1; }
body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; color: #000; }
</style>
</head>
<body><div class='WordSection1'>`;
    const footer = '</div></body></html>';
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + paragraphs + footer);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = source;
    a.download = `JobFit_CoverLetter_${jobContext.title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.doc`;
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = () => {
    if (!streamedText) return;
    const paragraphs = streamedText
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JobFit Cover Letter</title>
<style>
  @page { size: letter; margin: 1in; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; }
  p { margin: 0 0 12pt 0; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  ${paragraphs}
  <script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;
    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    chrome.tabs.create({ url });
  };

  const handleOpenInDrive = async () => {
    if (!streamedText) return;
    setDriveError(null);
    const paragraphs = streamedText
      .split(/\n{2,}/)
      .map(p => `<p style="font-family:Georgia,serif;font-size:11pt;line-height:1.5;margin:0 0 12pt 0;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${paragraphs}</body></html>`;
    try {
      await createGoogleDoc(html, `Cover Letter — ${jobContext.title}`);
    } catch (err: any) {
      if (err instanceof DriveAuthError) {
        setDriveConnected(false);
        setDriveError('Google Drive access expired. Sign out and sign in again.');
      } else {
        setDriveError(err.message || 'Failed to open in Google Drive');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('analysis')}
          className="text-xs font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <span className="px-3 py-1 bg-purple-600/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-purple-500/10">
          Cover Letter
        </span>
      </div>

      {/* Job context */}
      <div className="p-5 bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20 rounded-[2rem]">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Writing for</span>
        </div>
        <p className="text-sm font-bold text-white leading-snug">{jobContext.title}</p>
        <p className="text-xs text-slate-500 mt-1">{extractCompanyName(jobContext)}</p>
        {(selectedGaps.length + selectedKeywords.length) > 0 && (
          <p className="text-[10px] text-slate-600 mt-2 font-medium">
            Personalizing around {selectedGaps.length + selectedKeywords.length} selection{selectedGaps.length + selectedKeywords.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Tone selector */}
      <div className="space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Choose Tone</p>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedTone(opt.value)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedTone === opt.value
                  ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <p className={`text-xs font-black ${selectedTone === opt.value ? 'text-purple-400' : 'text-slate-300'}`}>
                {opt.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {!streamedText && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-3 p-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20 active:scale-95"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {generating ? (stage || 'Writing...') : 'Generate Cover Letter'}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Streaming output */}
      {(streamedText || generating) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {generating && stage && (
            <div className="flex items-center gap-2 p-2 text-xs text-purple-400 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> {stage}
            </div>
          )}
          <div className="relative p-6 bg-slate-900 border border-slate-800 rounded-[2rem] min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-medium" style={{ fontFamily: 'Georgia, serif' }}>
              {streamedText}
              {generating && (
                <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
          {streamedText && !generating && (
            <p className="text-[10px] text-slate-600 text-right font-medium">
              {streamedText.trim().split(/\s+/).length} words
            </p>
          )}

          {/* Actions */}
          {!generating && streamedText && (
            <>
              {driveError && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <p>{driveError}</p>
                </div>
              )}
              <div className={`grid gap-2 ${driveConnected ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-700 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  <Download className="w-3 h-3" />
                  DOCX
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center justify-center gap-2 p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
                {driveConnected && (
                  <button
                    onClick={handleOpenInDrive}
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Drive
                  </button>
                )}
              </div>
            </>
          )}

          {/* Regenerate */}
          {!generating && streamedText && (
            <button
              onClick={handleGenerate}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3 h-3" />
              Regenerate with same tone
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CoverLetter;
