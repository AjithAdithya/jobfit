import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  History, Target, Briefcase, Zap, Trash2,
  Loader2, Download, Clock, ChevronDown
} from 'lucide-react';
import { getMatchLevel } from '../lib/matchLevel';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/useUIStore';

export interface HistoryItem {
  id: string;
  job_title: string;
  job_url: string;
  site_name: string;
  score: number;
  matches: string[];
  gaps: string[];
  keywords: string[];
  selected_gaps?: string[];
  selected_keywords?: string[];
  status: 'Evaluating' | 'Applied' | 'Interviewing' | 'Rejected' | 'Offer';
  created_at: string;
  generated_resume: string | null;
  cover_letter?: string | null;
  cover_letter_tone?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  Evaluating: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Interviewing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const STATUS_OPTIONS = [
  { value: 'Evaluating', label: 'Evaluating', dot: 'bg-slate-400' },
  { value: 'Applied',    label: 'Applied',    dot: 'bg-blue-400' },
  { value: 'Interviewing', label: 'Interviewing', dot: 'bg-purple-400' },
  { value: 'Offer',     label: 'Offer',      dot: 'bg-emerald-400' },
  { value: 'Rejected',  label: 'Rejected',   dot: 'bg-rose-400' },
];

const MatchHistory: React.FC = () => {
  const { user } = useAuth();
  const { setView, setActiveHistory, setJobContext } = useUIStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Analytics State
  const [avgScore, setAvgScore] = useState(0);
  const [topGaps, setTopGaps] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const items = data as HistoryItem[];
      setHistory(items);
      
      // Calculate Analytics
      if (items.length > 0) {
        const total = items.reduce((acc, curr) => acc + curr.score, 0);
        setAvgScore(Math.round(total / items.length));
        
        const gapCounts: Record<string, number> = {};
        items.forEach(item => {
          (item.gaps || []).forEach(g => {
            gapCounts[g] = (gapCounts[g] || 0) + 1;
          });
        });
        
        const sortedGaps = Object.entries(gapCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
          
        setTopGaps(sortedGaps);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      setHistory(history.map(h => h.id === id ? { ...h, status: newStatus as any } : h));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const openMatch = (item: HistoryItem) => {
    setActiveHistory(item);
    setJobContext({
      title: item.job_title,
      url: item.job_url,
      siteName: item.site_name
    });
    setView('analysis');
  };

  const downloadNativeDocx = (htmlContent: string, jobTitle: string) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `JobFit_Tailored_${jobTitle.replace(/[^a-z0-9]/gi, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-400">Loading your journey...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" /> Activity Log
        </h2>
        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          {history.length} Jobs
        </span>
      </div>

      {/* Analytics Dashboard */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Avg Match</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white leading-none">{avgScore}</span>
              <span className="text-blue-500/50 font-bold mb-1">/100</span>
            </div>
          </div>
          
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl row-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" /> Frequent Gaps
            </p>
            <div className="space-y-3">
              {topGaps.map((gap, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{gap.name}</span>
                    <span className="text-slate-500 font-bold">{gap.count}x</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.max(10, (gap.count / history.length) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {topGaps.length === 0 && <p className="text-xs text-slate-500">No major gaps recorded yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="p-5 bg-slate-900 border border-slate-800 rounded-[2rem] hover:border-slate-700 transition-colors group relative overflow-hidden">
            
            {/* Background Match Color Hint */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] opacity-10 rounded-full ${getMatchLevel(item.score).glowClass}`} />

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-white leading-tight mb-1">{item.job_title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Briefcase className="w-3 h-3" />
                    <span>{item.site_name}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="relative" ref={openStatusId === item.id ? dropdownRef : null}>
                  <button
                    onClick={() => setOpenStatusId(prev => prev === item.id ? null : item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${STATUS_COLORS[item.status]}`}
                  >
                    {item.status}
                    <ChevronDown className={`w-3 h-3 transition-transform ${openStatusId === item.id ? 'rotate-180' : ''}`} />
                  </button>

                  {openStatusId === item.id && (
                    <div className="absolute right-0 top-8 z-50 min-w-[148px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { updateStatus(item.id, opt.value); setOpenStatusId(null); }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors text-left ${item.status === opt.value ? 'text-white' : 'text-slate-400'}`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openMatch(item)}
                  className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group/btn"
                >
                  <Target className={`w-5 h-5 mb-1 group-hover/btn:scale-110 transition-transform ${getMatchLevel(item.score).textClass}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-white">{item.score}%</span>
                  <span className={`text-[8px] font-bold ${getMatchLevel(item.score).textClass} opacity-80 mt-0.5 truncate max-w-full`}>{getMatchLevel(item.score).label}</span>
                </button>

                <button 
                  onClick={() => item.generated_resume ? downloadNativeDocx(item.generated_resume, item.job_title) : null}
                  disabled={!item.generated_resume}
                  className={`flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl transition-all border border-transparent ${item.generated_resume ? 'hover:bg-slate-800 hover:border-emerald-500/30 group/btn cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                >
                  <Download className={`w-5 h-5 mb-1 ${item.generated_resume ? 'text-emerald-500 group-hover/btn:-translate-y-1 transition-transform' : 'text-slate-600'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${item.generated_resume ? 'text-slate-400 group-hover/btn:text-white' : 'text-slate-600'}`}>
                    {item.generated_resume ? 'Get Resume' : 'No Resume'}
                  </span>
                </button>

                <button 
                  onClick={() => deleteItem(item.id)}
                  className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/30 group/btn"
                >
                  <Trash2 className="w-5 h-5 text-rose-500/50 mb-1 group-hover/btn:text-rose-500 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/btn:text-rose-400">Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {history.length === 0 && !error && (
          <div className="py-20 flex flex-col items-center text-center space-y-4 bg-slate-900/50 border border-slate-800 border-dashed rounded-[2rem]">
            <History className="w-10 h-10 text-slate-600" />
            <div className="space-y-1">
              <h3 className="font-bold text-white">No history yet</h3>
              <p className="text-xs text-slate-500">Analyze a job description to start tracking.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MatchHistory;
