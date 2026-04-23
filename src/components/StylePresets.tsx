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
    <div className="p-4 bg-white border border-ink-200 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink-700 uppercase tracking-widest">
        <Palette className="w-4 h-4 text-ink-500" /> Style Options
      </h3>

      {/* Source tabs */}
      <div className="flex gap-px bg-ink-200 border border-ink-200">
        {(['prompt', 'template'] as StyleSource[]).map(s => (
          <button
            key={s}
            onClick={() => { setSource(s); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
              source === s ? 'bg-ink-900 text-cream' : 'bg-white text-ink-500 hover:text-ink-900'
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
              className="w-full p-3 bg-ink-50 border border-ink-200 text-xs text-ink-900 resize-none focus:outline-none focus:border-crimson-500 placeholder:text-ink-400"
            />
          </motion.div>
        ) : (
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
              className={`w-full flex items-center gap-3 p-4 border-2 border-dashed transition-all group ${
                templateFile
                  ? 'border-crimson-500/40 bg-crimson-500/5'
                  : 'border-ink-200 hover:border-ink-900 bg-ink-50'
              }`}
            >
              <div className={`p-2 shrink-0 transition-colors ${templateFile ? 'bg-crimson-500/10' : 'bg-ink-100 group-hover:bg-crimson-500/10'}`}>
                <FileText className={`w-4 h-4 transition-colors ${templateFile ? 'text-crimson-500' : 'text-ink-500 group-hover:text-crimson-500'}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                {templateFile ? (
                  <>
                    <p className="text-xs font-bold text-crimson-500 truncate">{templateFile.name}</p>
                    <p className="text-[10px] text-ink-500">{(templateFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-ink-700">Upload any resume PDF</p>
                    <p className="text-[10px] text-ink-400">We'll extract its fonts, sizes &amp; spacing</p>
                  </>
                )}
              </div>
              {templateFile && <Check className="w-4 h-4 text-crimson-500 shrink-0" />}
            </button>

            {templateFile && (
              <p className="text-[10px] text-ink-500 text-center">
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
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-40 text-cream font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
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
            className="flex items-center justify-center gap-2 p-3 bg-ink-50 hover:bg-ink-100 disabled:opacity-40 text-ink-900 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-ink-200 px-4"
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
          className="p-3 bg-ink-50 border border-ink-200 flex items-center gap-3"
        >
          <div
            className="w-6 h-6 shrink-0 border-2"
            style={{ backgroundColor: previewStyle.colors.primary, borderColor: previewStyle.colors.primary }}
          />
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-ink-700">Style Applied</p>
            <p className="text-xs text-ink-500 truncate">
              {previewStyle.fontFamily.body} · {previewStyle.fontSize.body}pt body · {previewStyle.columns}col
            </p>
          </div>
          <Check className="w-4 h-4 text-ink-700 shrink-0" />
        </motion.div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-flare/10 border border-flare/30 text-flare text-xs">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Saved presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow">Saved Presets</p>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar border-t border-ink-100 pt-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className={`w-full flex items-center gap-3 p-3 border text-left transition-all group ${
                  appliedId === preset.id
                    ? 'bg-crimson-500/10 border-crimson-500/30'
                    : 'bg-white border-ink-200 hover:border-ink-900'
                }`}
              >
                <div
                  className="w-4 h-4 shrink-0 border"
                  style={{ backgroundColor: preset.style_json.colors?.primary || '#000', borderColor: 'transparent' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-900 font-medium truncate">{preset.name}</p>
                  <p className="text-[10px] text-ink-500">
                    {preset.style_json.fontFamily?.body} · {preset.style_json.fontSize?.body}pt
                    {preset.instruction.startsWith('[Template:') ? ' · from template' : ''}
                  </p>
                </div>
                <button
                  onClick={e => handleDeletePreset(preset.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-ink-300 hover:text-flare transition-all"
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
