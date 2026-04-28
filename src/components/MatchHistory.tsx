import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download, ChevronDown, ArrowUpRight } from 'lucide-react';
import { getMatchLevel } from '../lib/matchLevel';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/useUIStore';

const WEBSITE_URL = 'https://jobfit-amber.vercel.app'

async function openWebDashboard() {
  const { data: { session } } = await supabase.auth.getSession()
  let url = `${WEBSITE_URL}/login`
  if (session) {
    url = `${WEBSITE_URL}/login#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=bearer`
  }
  chrome.tabs.create({ url })
}

async function openInEditor(itemId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  let url = `${WEBSITE_URL}/dashboard/history/${itemId}/edit`
  if (session) {
    url = `${WEBSITE_URL}/login#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=bearer&redirect=/dashboard/history/${itemId}/edit`
  }
  chrome.tabs.create({ url })
}

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

const STATUS_STYLE: Record<string, string> = {
  Evaluating:   'border-ink-300 text-ink-500',
  Applied:      'border-sky text-sky bg-sky/5',
  Interviewing: 'border-ink-900 text-ink-900 bg-ink-900/5',
  Offer:        'border-citrus text-ink-900 bg-citrus',
  Rejected:     'border-flare text-flare bg-flare/5',
};

const STATUS_OPTIONS = [
  { value: 'Evaluating',   label: 'evaluating' },
  { value: 'Applied',      label: 'applied' },
  { value: 'Interviewing', label: 'interviewing' },
  { value: 'Offer',        label: 'offer' },
  { value: 'Rejected',     label: 'rejected' },
];

const MatchHistory: React.FC = () => {
  const { user } = useAuth();
  const { setView, setActiveHistory, setJobContext } = useUIStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [avgScore, setAvgScore] = useState(0);
  const [topGaps, setTopGaps] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { fetchHistory(); }, [user]);

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

  const downloadTex = (latex: string, jobTitle: string) => {
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `JobFit_${jobTitle.replace(/[^a-z0-9]/gi, '_')}.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center text-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-crimson-500" />
        <p className="eyebrow text-ink-500">loading your journey…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div>
        <p className="eyebrow text-ink-500 mb-3">№ 02 — activity log</p>
        <div className="flex items-end justify-between">
          <h2 className="font-chunk text-[36px] leading-none tracking-tight text-ink-900">
            your <span className="serif-accent text-crimson-500">journey</span>
          </h2>
          <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">{history.length} jobs</span>
        </div>
        <button
          onClick={openWebDashboard}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-crimson-500 text-cream transition-colors group"
        >
          <span className="font-chunk text-[12px]">
            <span className="text-cream">Job</span><span className="serif-accent text-crimson-200 group-hover:text-cream/70">fit</span>
          </span>
          <span className="text-[11px] font-medium text-cream/70 group-hover:text-cream transition-colors">— open web dashboard</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-cream/50 group-hover:text-cream ml-auto transition-colors" />
        </button>
      </div>

      {/* Stats — editorial grid */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-ink-900 border border-ink-900">
          <div className="p-5 bg-cream">
            <p className="eyebrow text-ink-500 mb-4">avg match</p>
            <div className="flex items-baseline gap-1">
              <span className="num font-chunk text-[52px] leading-none tracking-tight text-ink-900">{avgScore}</span>
              <span className="num text-[13px] text-ink-400">/100</span>
            </div>
          </div>
          <div className="p-5 bg-cream row-span-2">
            <p className="eyebrow text-ink-500 mb-4">frequent gaps</p>
            <div className="space-y-2.5">
              {topGaps.map((gap, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink-700 truncate max-w-[140px]">{gap.name}</span>
                    <span className="num text-ink-400">×{gap.count}</span>
                  </div>
                  <div className="h-1 w-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-crimson-500"
                      style={{ width: `${Math.max(10, (gap.count / history.length) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {topGaps.length === 0 && <p className="text-[12px] text-ink-400 italic font-serif">no major gaps recorded yet.</p>}
            </div>
          </div>
          <div className="p-5 bg-cream">
            <p className="eyebrow text-ink-500 mb-4">total tracked</p>
            <span className="num font-chunk text-[52px] leading-none tracking-tight text-ink-900">{String(history.length).padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="border-t border-ink-900">
        {history.map((item) => {
          const level = getMatchLevel(item.score);
          return (
            <div key={item.id} className="border-b border-ink-200 group">
              <div className="grid grid-cols-12 gap-2 items-center py-4 px-2 hover:bg-ink-50 transition-colors">
                {/* Score dot + number */}
                <button
                  onClick={() => openMatch(item)}
                  className="col-span-2 flex items-center gap-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${level.gradientFrom}, ${level.gradientTo})` }}
                  />
                  <span className="num font-chunk text-[22px] leading-none text-ink-900">{item.score}</span>
                </button>

                {/* Title */}
                <button
                  onClick={() => openMatch(item)}
                  className="col-span-7 text-left min-w-0"
                >
                  <h3 className="font-chunk text-[16px] leading-tight tracking-tight text-ink-900 truncate">{item.job_title}</h3>
                  <p className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-1.5">
                    <span className="truncate max-w-[120px]">{item.site_name}</span>
                    <span>·</span>
                    <span className="font-mono tracking-caps uppercase text-[9px]">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
                  </p>
                </button>

                {/* Status */}
                <div className="col-span-3 flex justify-end relative" ref={openStatusId === item.id ? dropdownRef : null}>
                  <button
                    onClick={() => setOpenStatusId(prev => prev === item.id ? null : item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono tracking-caps uppercase border transition-all ${STATUS_STYLE[item.status]}`}
                  >
                    {item.status.toLowerCase()}
                    <ChevronDown className={`w-3 h-3 transition-transform ${openStatusId === item.id ? 'rotate-180' : ''}`} />
                  </button>
                  {openStatusId === item.id && (
                    <div className="absolute right-0 top-8 z-50 min-w-[140px] bg-white border border-ink-900 shadow-print-md">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { updateStatus(item.id, opt.value); setOpenStatusId(null); }}
                          className={`w-full px-3 py-2 text-[11px] font-mono tracking-caps uppercase text-left hover:bg-ink-50 transition-colors border-b border-ink-100 last:border-0 ${item.status === opt.value ? 'text-ink-900 font-medium' : 'text-ink-500'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action strip */}
              <div className="grid grid-cols-3 text-[10px] font-mono tracking-caps uppercase border-t border-ink-100">
                <button
                  onClick={() => openMatch(item)}
                  className="px-3 py-2 flex items-center justify-center gap-1.5 hover:bg-ink-900 hover:text-cream transition-colors text-ink-500"
                >
                  <ArrowUpRight className="w-3 h-3" /> open
                </button>
                <button
                  onClick={() => item.generated_resume ? downloadTex(item.generated_resume, item.job_title) : null}
                  disabled={!item.generated_resume}
                  className="px-3 py-2 flex items-center justify-center gap-1.5 border-l border-r border-ink-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink-900 hover:text-cream transition-colors text-ink-500"
                >
                  <Download className="w-3 h-3" /> {item.generated_resume ? '.tex' : 'no resume'}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="px-3 py-2 flex items-center justify-center gap-1.5 hover:bg-flare hover:text-cream transition-colors text-ink-500"
                >
                  remove
                </button>
              </div>

              {/* Edit in Dashboard — shown only when a resume exists */}
              {item.generated_resume && (
                <button
                  onClick={() => openInEditor(item.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-crimson-500 text-cream transition-colors group border-t border-ink-800"
                >
                  <span className="font-chunk text-[12px]">
                    <span className="text-cream">Job</span><span className="serif-accent text-crimson-200 group-hover:text-cream/70">fit</span>
                  </span>
                  <span className="text-[10px] font-medium text-cream/70 group-hover:text-cream transition-colors tracking-wide">— edit in dashboard</span>
                  <ArrowUpRight className="w-3 h-3 text-cream/50 group-hover:text-cream ml-auto transition-colors" />
                </button>
              )}
            </div>
          );
        })}

        {history.length === 0 && !error && (
          <div className="py-16 flex flex-col items-center text-center gap-3 border border-dashed border-ink-300">
            <p className="font-chunk text-[24px] tracking-tight text-ink-900">nothing here yet</p>
            <p className="text-[13px] text-ink-500 italic font-serif">that's a feature — analyze a job to begin.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MatchHistory;
