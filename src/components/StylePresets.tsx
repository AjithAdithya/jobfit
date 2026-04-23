import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, Trash2, Loader2, Palette, Check, Upload, FileText, AlertCircle } from 'lucide-react';
import { runStylistAgent, runStyleExtractorAgent } from '../lib/agents';
import { extractPdfStyleData } from '../lib/styleUtils';
import type { ResumeStyle } from '../lib/types';
import { supabase } from '../lib/supabase';

interface StylePreset {
  id: string;
  name: string;
  instruction: string;
  style_json: ResumeStyle;
  created_at: string;
}

interface StylePresetsProps {
  onStyleApplied: (style: ResumeStyle) => void;
}

type StyleSource = 'prompt' | 'template';

const PLACEHOLDER_EXAMPLES = [
  'Modern look, Inter font, dark navy headers',
  'Clean minimal, Georgia serif, single column',
  'Bold two-column, dark accent, tight spacing',
];

const StylePresets: React.FC<StylePresetsProps> = ({ onStyleApplied }) => {
  const [source, setSource] = useState<StyleSource>('prompt');
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [instruction, setInstruction] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<ResumeStyle | null>(null);
  const [previewLabel, setPreviewLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPresets(); }, []);

  const fetchPresets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('style_presets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPresets(data as StylePreset[]);
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Template PDF must be under 5 MB.');
      return;
    }
    setTemplateFile(file);
    setError(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      let style: ResumeStyle;
      if (source === 'template') {
        if (!templateFile) throw new Error('No template file selected.');
        const pdfData = await extractPdfStyleData(templateFile);
        style = await runStyleExtractorAgent(pdfData);
        setPreviewLabel(templateFile.name);
      } else {
        if (!instruction.trim()) throw new Error('Enter a style description first.');
        style = await runStylistAgent(instruction.trim());
        setPreviewLabel(instruction.trim().slice(0, 50));
      }
      setPreviewStyle(style);
      onStyleApplied(style);
      setAppliedId(null);
    } catch (err: any) {
      setError('Failed to generate style: ' + (err.message || String(err)));
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePreset = async () => {
    if (!previewStyle) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const name = previewLabel || (source === 'template' ? templateFile?.name || 'Template' : instruction.slice(0, 50));
      await supabase.from('style_presets').insert({
        user_id: user.id,
        name,
        instruction: source === 'template' ? `[Template: ${name}]` : instruction.trim(),
        style_json: previewStyle,
      });
      await fetchPresets();
    } catch (err: any) {
      setError('Failed to save preset: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPreset = (preset: StylePreset) => {
    setInstruction(preset.instruction.startsWith('[Template:') ? '' : preset.instruction);
    setPreviewStyle(preset.style_json);
    setPreviewLabel(preset.name);
    onStyleApplied(preset.style_json);
    setAppliedId(preset.id);
  };

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('style_presets').delete().eq('id', id);
    if (!error) {
      setPresets(presets.filter(p => p.id !== id));
      if (appliedId === id) setAppliedId(null);
    }
  };

  const canGenerate = source === 'template' ? !!templateFile : !!instruction.trim();

  return (
    <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-[2rem] space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-300 uppercase tracking-widest">
        <Palette className="w-4 h-4 text-purple-400" /> Style Options
      </h3>

      {/* Source tabs */}
      <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
        {(['prompt', 'template'] as StyleSource[]).map(s => (
          <button
            key={s}
            onClick={() => { setSource(s); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              source === s ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {s === 'prompt' ? <Sparkles className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
            {s === 'prompt' ? 'Describe Style' : 'Upload Template'}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <AnimatePresence mode="wait" initial={false}>
        {source === 'prompt' ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <textarea
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              placeholder={PLACEHOLDER_EXAMPLES[0]}
              rows={2}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 font-medium resize-none focus:outline-none focus:border-purple-500/50 placeholder:text-slate-600"
            />
          </motion.div>
        ) : (
          /* Template upload */
          <motion.div
            key="template"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleTemplateUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl transition-all group ${
                templateFile
                  ? 'border-purple-500/40 bg-purple-600/5'
                  : 'border-slate-700 hover:border-purple-500/40 bg-slate-950'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${templateFile ? 'bg-purple-600/20' : 'bg-slate-800 group-hover:bg-purple-600/20'} transition-colors`}>
                <FileText className={`w-4 h-4 ${templateFile ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'} transition-colors`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                {templateFile ? (
                  <>
                    <p className="text-xs font-bold text-purple-300 truncate">{templateFile.name}</p>
                    <p className="text-[10px] text-slate-500">{(templateFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-400">Upload any resume PDF</p>
                    <p className="text-[10px] text-slate-600">We'll extract its fonts, sizes & spacing</p>
                  </>
                )}
              </div>
              {templateFile && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
            </button>

            {templateFile && (
              <p className="text-[10px] text-slate-500 text-center">
                The AI will match fonts, sizes, and spacing from your template.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate + Save buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {generating
            ? (source === 'template' ? 'Extracting...' : 'Generating...')
            : (source === 'template' ? 'Extract Style' : 'Apply Style')
          }
        </button>
        {previewStyle && (
          <button
            onClick={handleSavePreset}
            disabled={saving}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-slate-700 px-4"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        )}
      </div>

      {/* Style preview badge */}
      {previewStyle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center gap-3"
        >
          <div
            className="w-6 h-6 rounded-lg border-2 flex-shrink-0"
            style={{ backgroundColor: previewStyle.colors.primary, borderColor: previewStyle.colors.primary }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Style Applied</p>
            <p className="text-xs text-slate-400 truncate">
              {previewStyle.fontFamily.body} · {previewStyle.fontSize.body}pt body · {previewStyle.columns}col
            </p>
          </div>
          <Check className="w-4 h-4 text-purple-400 shrink-0" />
        </motion.div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Saved presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Saved Presets</p>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all group ${
                  appliedId === preset.id
                    ? 'bg-purple-600/10 border-purple-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 border"
                  style={{ backgroundColor: preset.style_json.colors?.primary || '#000', borderColor: 'transparent' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 font-medium truncate">{preset.name}</p>
                  <p className="text-[10px] text-slate-600">
                    {preset.style_json.fontFamily?.body} · {preset.style_json.fontSize?.body}pt
                    {preset.instruction.startsWith('[Template:') ? ' · from template' : ''}
                  </p>
                </div>
                <button
                  onClick={e => handleDeletePreset(preset.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-600 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StylePresets;
