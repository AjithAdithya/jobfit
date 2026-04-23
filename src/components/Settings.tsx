import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Key, Mail, LogOut, ChevronDown, Zap, Loader2,
  Eye, EyeOff, Check, Trash2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ModelStats {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();

  // API Keys state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [voyageKey, setVoyageKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showVoyageKey, setShowVoyageKey] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [apiStatus, setApiStatus] = useState<'valid' | 'missing' | 'checking'>('checking');
  const [showKeys, setShowKeys] = useState(false);

  // AI Usage state
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [showUsage, setShowUsage] = useState(false);

  // Privacy state
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [loading, setLoading] = useState(true);

  // Load stored keys and resolve api status
  useEffect(() => {
    chrome.storage.local.get(['jobfit_anthropic_key', 'jobfit_voyage_key'], (result) => {
      const storedAnthropic = (result.jobfit_anthropic_key as string) || '';
      const storedVoyage = (result.jobfit_voyage_key as string) || '';
      setAnthropicKey(storedAnthropic);
      setVoyageKey(storedVoyage);

      const hasAnthropic = !!(storedAnthropic || import.meta.env.VITE_ANTHROPIC_API_KEY);
      const hasVoyage = !!(storedVoyage || import.meta.env.VITE_VOYAGE_API_KEY);
      setApiStatus(hasAnthropic && hasVoyage ? 'valid' : 'missing');
    });
  }, []);

  // Fetch usage stats from Supabase
  useEffect(() => {
    if (!user) return;

    supabase
      .from('generations')
      .select('model_used, prompt_tokens, completion_tokens, cost_usd')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, ModelStats>();
        for (const row of data) {
          const key = row.model_used || 'unknown';
          const existing = map.get(key) ?? { model: key, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
          existing.calls += 1;
          existing.inputTokens += row.prompt_tokens || 0;
          existing.outputTokens += row.completion_tokens || 0;
          existing.cost += Number(row.cost_usd) || 0;
          map.set(key, existing);
        }
        const stats = Array.from(map.values()).sort((a, b) => b.cost - a.cost);
        setModelStats(stats);
        setTotalCalls(data.length);
        setTotalCost(stats.reduce((s, r) => s + r.cost, 0));
      })
      .then(() => setLoading(false), () => setLoading(false));
  }, [user]);

  const handleSaveKeys = () => {
    chrome.storage.local.set(
      { jobfit_anthropic_key: anthropicKey.trim(), jobfit_voyage_key: voyageKey.trim() },
      () => {
        const hasAnthropic = !!(anthropicKey.trim() || import.meta.env.VITE_ANTHROPIC_API_KEY);
        const hasVoyage = !!(voyageKey.trim() || import.meta.env.VITE_VOYAGE_API_KEY);
        setApiStatus(hasAnthropic && hasVoyage ? 'valid' : 'missing');
        setKeysSaved(true);
        setTimeout(() => setKeysSaved(false), 2500);
      }
    );
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    if (!window.confirm('Delete all your data? This cannot be undone.')) return;
    setDeleting(true);
    await Promise.all([
      supabase.from('resume_chunkies').delete().eq('user_id', user.id),
      supabase.from('resumes').delete().eq('user_id', user.id),
      supabase.from('analysis_history').delete().eq('user_id', user.id),
      supabase.from('generations').delete().eq('user_id', user.id),
      supabase.from('style_presets').delete().eq('user_id', user.id),
    ]);
    chrome.storage.local.remove(['jobfit_anthropic_key', 'jobfit_voyage_key']);
    setDeleting(false);
    signOut();
  };

  const formatTokens = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Profile */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate">{user?.email}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              <Mail className="w-3 h-3" />
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Developer Plan'}
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowKeys(v => !v)}
          className="w-full flex items-center gap-4 p-4"
        >
          <div className="p-2 bg-slate-800 rounded-xl shrink-0">
            <Key className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold">API Keys</p>
            <p className="text-[10px] text-slate-500 truncate">
              {apiStatus === 'valid' ? 'Anthropic + Voyage configured' : 'Missing keys — add them below'}
            </p>
          </div>
          <span className={`text-xs font-black shrink-0 ${apiStatus === 'valid' ? 'text-emerald-400' : 'text-red-400'}`}>
            {apiStatus === 'checking' ? '...' : apiStatus === 'valid' ? 'Active' : 'Missing'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${showKeys ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {showKeys && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 pt-3 font-medium">
                  Keys are saved locally in your browser and never sent to our servers.
                </p>

                {/* Anthropic */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anthropic</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showAnthropicKey ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
                    />
                    <button
                      onClick={() => setShowAnthropicKey(v => !v)}
                      className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Voyage */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voyage</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showVoyageKey ? 'text' : 'password'}
                      value={voyageKey}
                      onChange={e => setVoyageKey(e.target.value)}
                      placeholder="pa-..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
                    />
                    <button
                      onClick={() => setShowVoyageKey(v => !v)}
                      className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showVoyageKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveKeys}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  {keysSaved ? <Check className="w-3 h-3 text-emerald-300" /> : <Key className="w-3 h-3" />}
                  {keysSaved ? 'Saved!' : 'Save Keys'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Usage */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowUsage(v => !v)}
          className="w-full flex items-center gap-4 p-4"
        >
          <div className="p-2 bg-slate-800 rounded-xl shrink-0">
            <Zap className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold">AI Usage</p>
            <p className="text-[10px] text-slate-500 truncate">
              {loading ? 'Loading...' : `${totalCalls} generations · $${totalCost.toFixed(4)} spent`}
            </p>
          </div>
          <span className="text-xs font-black shrink-0 text-amber-400">
            {loading ? '...' : `${totalCalls} calls`}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${showUsage ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {showUsage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-slate-800">
                {modelStats.length === 0 ? (
                  <p className="text-[10px] text-slate-500 pt-3">No AI calls recorded yet.</p>
                ) : (
                  <div className="space-y-3 pt-3">
                    {modelStats.map(s => (
                      <div key={s.model} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">{s.model}</span>
                          <span className="text-xs font-black text-amber-400">${s.cost.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            {formatTokens(s.inputTokens)} in / {formatTokens(s.outputTokens)} out tokens
                          </span>
                          <span className="text-[10px] text-slate-500">{s.calls} calls</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-300">Total</span>
                      <span className="text-xs font-black text-amber-400">{totalCalls} calls · ${totalCost.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy & Security */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowPrivacy(v => !v)}
          className="w-full flex items-center gap-4 p-4"
        >
          <div className="p-2 bg-slate-800 rounded-xl shrink-0">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold">Privacy & Security</p>
            <p className="text-[10px] text-slate-500 truncate">Guardrails active · Data encrypted at rest</p>
          </div>
          <span className="text-xs font-black shrink-0 text-emerald-400">Protected</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${showPrivacy ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {showPrivacy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-slate-800 space-y-4">
                <ul className="space-y-1.5 pt-3">
                  {[
                    'Guardrails active on all JD inputs',
                    'Guardian output validation on all resumes',
                    'Resume data encrypted at rest (Supabase)',
                    'API keys stored locally in browser only',
                    'No raw JD text sent without sanitization',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-slate-400">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Data stored for your account</p>
                  <ul className="space-y-1">
                    {['Resume files + embedding chunks', 'Job analysis history', 'AI generation logs', 'Style presets'].map(item => (
                      <li key={item} className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleDeleteAllData}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {deleting ? 'Deleting...' : 'Delete All My Data'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sign Out */}
      <div className="pt-2 border-t border-slate-800/50">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};

export default Settings;
