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
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">My Resumes</h2>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".pdf" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
          <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-lg">
            {tab === 'uploaded' ? resumes.length : generatedResumes.length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        {(['uploaded', 'generated'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'uploaded' ? <Upload className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {t === 'uploaded' ? 'Uploaded' : 'Generated'}
          </button>
        ))}
      </div>

      {/* Drive error banner */}
      {driveError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2 text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{driveError}</p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{uploadError}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : tab === 'uploaded' ? (
        /* ── Uploaded tab ── */
        <div className="space-y-3">
          {resumes.map(resume => (
            <div
              key={resume.id}
              onClick={() => setActiveResume(resume.id, resume.file_name)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                activeResumeId === resume.id
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl transition-colors ${activeResumeId === resume.id ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate pr-8">{resume.file_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(resume.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeResumeId === resume.id && (
                    <div className="bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/50">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <button
                    onClick={e => handleDelete(resume.id, e)}
                    className="p-2 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {resumes.length === 0 && !processing && (
            <div className="text-center py-12 px-6 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl group">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500/50 transition-all">
                <Upload className="w-8 h-8 text-slate-700 group-hover:text-blue-500 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No resumes yet</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-[200px] mx-auto">Upload your first resume to start matching with jobs.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
              >
                Upload Resume
              </button>
            </div>
          )}

          {processing && (
            <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-600/5 flex items-center gap-4 animate-pulse">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-slate-800 rounded mb-2" />
                <div className="h-2 w-16 bg-slate-800 rounded" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Generated tab ── */
        <div className="space-y-3">
          {generatedResumes.map(gr => (
            <div key={gr.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-600/20 rounded-xl shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{gr.job_title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(gr.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`grid gap-2 ${driveConnected ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => downloadDocx(gr.generated_resume, gr.job_title)}
                  className="flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  <Download className="w-3 h-3" /> DOCX
                </button>
                {driveConnected && (
                  <button
                    onClick={() => handleOpenInDrive(gr.generated_resume, gr.job_title)}
                    className="flex items-center justify-center gap-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" /> Edit in Drive
                  </button>
                )}
              </div>
            </div>
          ))}

          {generatedResumes.length === 0 && (
            <div className="text-center py-12 px-6 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No generated resumes yet</h3>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Analyze a job and generate a tailored resume to see it here.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ResumeManager;
