import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, Quote } from 'lucide-react'
import type { HardRequirement } from '../lib/hardRequirementsChecker'

const CATEGORY_LABEL: Record<HardRequirement['category'], string> = {
  experience: 'exp',
  skill: 'skill',
  education: 'edu',
  certification: 'cert',
  other: 'req',
}

export default function HardRequirementsRibbon({ requirements }: { requirements: HardRequirement[] }) {
  const [open, setOpen] = useState(false)
  if (!requirements.length) return null

  return (
    <div className="bg-white border border-flare/40 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-flare/5 transition-colors"
      >
        <div className="p-1.5 bg-flare/10 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-flare" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-bold text-flare">
            {requirements.length} hard requirement{requirements.length === 1 ? '' : 's'} missing
          </p>
          <p className="text-[10px] text-ink-400 mt-0.5">Minimum qualifications not found in your resume</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-flare/60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-flare/20 divide-y divide-ink-100">
              {requirements.map((req, i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[9px] text-flare tracking-caps uppercase bg-flare/10 px-1.5 py-0.5 shrink-0">
                      {CATEGORY_LABEL[req.category] ?? req.category}
                    </span>
                    <p className="text-[11px] font-bold text-ink-900 leading-snug">{req.requirement}</p>
                  </div>
                  <div className="flex items-start gap-1.5 pl-0.5">
                    <Quote className="w-3 h-3 text-ink-300 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-ink-500 italic leading-relaxed line-clamp-2">
                      {req.jdQuote}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
