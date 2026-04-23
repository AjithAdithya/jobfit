import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Check, Trash2, Clock, Plus, Loader2, Upload,
  AlertCircle, Sparkles, Download, ExternalLink,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../store/useUIStore';
import { useResumes } from '../hooks/useResumes';
import { useAuth } from '../hooks/useAuth';
import { hasDriveAccess, createGoogleDoc, DriveAuthError } from '../lib/gdrive';

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

interface GeneratedResume {
  id: string;
  job_title: string;
  created_at: string;
  generated_resume: string;
}

const ResumeManager: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'uploaded' | 'generated'>('uploaded');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const { activeResumeId, setActiveResume } = useUIStore();
  const { uploadAndProcess, processing, error: uploadError } = useResumes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
    hasDriveAccess().then(setDriveConnected);
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [uploadedRes, generatedRes] = await Promise.all([
      supabase.from('resumes').select('id, file_name, created_at').order('created_at', { ascending: false }),
      user
        ? supabase
            .from('analysis_history')
            .select('id, job_title, created_at, generated_resume')
            .eq('user_id', user.id)
            .not('generated_resume', 'is', null)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (!uploadedRes.error && uploadedRes.data) {
      setResumes(uploadedRes.data);
      if (!activeResumeId && uploadedRes.data.length > 0) {
        setActiveResume(uploadedRes.data[0].id, uploadedRes.data[0].file_name);
      }
    }
    if (!generatedRes.error && generatedRes.data) {
      setGeneratedResumes(generatedRes.data as GeneratedResume[]);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAndProcess(file);
      await fetchAll();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this resume?')) return;
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (!error) {
      const updated = resumes.filter(r => r.id !== id);
      setResumes(updated);
      if (activeResumeId === id) setActiveResume(updated[0]?.id || null, updated[0]?.file_name || null);
    }
  };

  const handleOpenInDrive = async (htmlContent: string, title: string) => {
    setDriveError(null);
    try {
      await createGoogleDoc(htmlContent, title);
    } catch (err: any) {
      if (err instanceof DriveAuthError) {
        setDriveError('Google Drive access expired. Sign out and sign in again to reconnect.');
        setDriveConnected(false);
      } else {
        setDriveError(err.message || 'Failed to open in Google Drive');
      }
    }
  };

  const downloadDocx = (htmlContent: string, title: string) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title></head><body>";
    const footer = '</body></html>';
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + htmlContent + footer);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = source;
    a.download = `JobFit_${title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.doc`;
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-ink-500 mb-1">№ 03 — vault</p>
          <h2 className="font-chunk text-[28px] leading-none tracking-tight text-ink-900">Resumes</h2>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".pdf" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="p-2 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-50 text-cream shadow-print-sm transition-all active:scale-95"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
          <span className="px-2 py-1 bg-ink-100 border border-ink-200 text-ink-500 eyebrow">
            {tab === 'uploaded' ? resumes.length : generatedResumes.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-px bg-ink-200 border border-ink-200">
        {(['uploaded', 'generated'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
              tab === t
                ? 'bg-ink-900 text-cream'
                : 'bg-white text-ink-500 hover:text-ink-900 hover:bg-ink-50'
            }`}
          >
            {t === 'uploaded' ? <Upload className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {t === 'uploaded' ? 'Uploaded' : 'Generated'}
          </button>
        ))}
      </div>

      {/* Drive error banner */}
      {driveError && (
        <div className="p-3 bg-flare/10 border border-flare/30 flex items-start gap-2 text-flare text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{driveError}</p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-flare/10 border border-flare/30 flex items-start gap-3 text-flare text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{uploadError}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-crimson-500" />
        </div>
      ) : tab === 'uploaded' ? (
        /* ── Uploaded tab ── */
        <div className="space-y-2 border-t border-ink-200">
          {resumes.map(resume => (
            <div
              key={resume.id}
              onClick={() => setActiveResume(resume.id, resume.file_name)}
              className={`group relative border-b border-ink-200 transition-all cursor-pointer ${
                activeResumeId === resume.id
                  ? 'bg-crimson-500/5 border-l-2 border-l-crimson-500'
                  : 'hover:bg-ink-50'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className={`p-2 shrink-0 transition-colors ${activeResumeId === resume.id ? 'bg-crimson-500' : 'bg-ink-100'}`}>
                  <FileText className={`w-4 h-4 ${activeResumeId === resume.id ? 'text-cream' : 'text-ink-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-ink-900 truncate pr-8">{resume.file_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 eyebrow text-ink-400 normal-case tracking-normal text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(resume.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeResumeId === resume.id && (
                    <div className="bg-citrus border border-ink-900 p-1">
                      <Check className="w-3 h-3 text-ink-900" />
                    </div>
                  )}
                  <button
                    onClick={e => handleDelete(resume.id, e)}
                    className="p-2 hover:bg-flare/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-ink-300 hover:text-flare" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {resumes.length === 0 && !processing && (
            <div className="text-center py-12 px-6 border border-dashed border-ink-300 mt-4 group">
              <div className="w-16 h-16 bg-ink-100 border border-ink-200 flex items-center justify-center mx-auto mb-4 group-hover:border-ink-900 transition-all">
                <Upload className="w-8 h-8 text-ink-300 group-hover:text-crimson-500 transition-all" />
              </div>
              <h3 className="font-chunk text-lg text-ink-900 mb-1">No resumes yet</h3>
              <p className="text-xs text-ink-500 mb-6 max-w-[200px] mx-auto">Upload your first resume to start matching with jobs.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-crimson-500 text-cream text-[10px] font-bold uppercase tracking-widest hover:bg-crimson-600 transition-all shadow-print-sm"
              >
                Upload Resume
              </button>
            </div>
          )}

          {processing && (
            <div className="p-4 border border-crimson-500/30 bg-crimson-500/5 flex items-center gap-4 animate-pulse mt-2">
              <div className="p-2 bg-crimson-500">
                <Loader2 className="w-5 h-5 text-cream animate-spin" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-ink-200 mb-2" />
                <div className="h-2 w-16 bg-ink-200" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Generated tab ── */
        <div className="space-y-2 border-t border-ink-200">
          {generatedResumes.map(gr => (
            <div key={gr.id} className="p-4 bg-white border-b border-ink-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ink-100 shrink-0">
                  <Sparkles className="w-4 h-4 text-ink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-900 truncate">{gr.job_title}</p>
                  <div className="flex items-center gap-1.5 eyebrow text-ink-400 mt-0.5 normal-case tracking-normal text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(gr.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`grid gap-2 ${driveConnected ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => downloadDocx(gr.generated_resume, gr.job_title)}
                  className="flex items-center justify-center gap-2 p-2.5 bg-crimson-500 hover:bg-crimson-600 text-cream font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-print-sm"
                >
                  <Download className="w-3 h-3" /> DOCX
                </button>
                {driveConnected && (
                  <button
                    onClick={() => handleOpenInDrive(gr.generated_resume, gr.job_title)}
                    className="flex items-center justify-center gap-2 p-2.5 bg-sky hover:bg-sky/80 text-ink-900 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" /> Edit in Drive
                  </button>
                )}
              </div>
            </div>
          ))}

          {generatedResumes.length === 0 && (
            <div className="text-center py-12 px-6 border border-dashed border-ink-300 mt-4">
              <div className="w-16 h-16 bg-ink-100 border border-ink-200 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-ink-300" />
              </div>
              <h3 className="font-chunk text-lg text-ink-900 mb-1">No generated resumes yet</h3>
              <p className="text-xs text-ink-500 max-w-[200px] mx-auto">Analyze a job and generate a tailored resume to see it here.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ResumeManager;
