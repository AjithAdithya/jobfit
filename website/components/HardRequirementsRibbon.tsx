'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, X } from 'lucide-react'

interface HardRequirement {
  requirement: string
  jdQuote: string
  category: 'experience' | 'skill' | 'education' | 'certification' | 'other'
}

const CATEGORY_LABEL: Record<HardRequirement['category'], string> = {
  experience: 'experience',
  skill: 'skill',
  education: 'education',
  certification: 'certification',
  other: 'requirement',
}

export default function HardRequirementsRibbon({ requirements }: { requirements: HardRequirement[] }) {
  const [open, setOpen] = useState(false)
  if (!requirements || requirements.length === 0) return null

  return (
    <div className="relative mb-3">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-flare/10 border border-flare/40 hover:bg-flare/15 transition-colors group gap-3"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-flare" />
          <span className="font-mono text-[11px] text-flare tracking-caps uppercase">
            <span className="num">{requirements.length}</span> hard requirement{requirements.length === 1 ? '' : 's'} missing
          </span>
        </div>
        <div className="flex items-center gap-2 text-flare">
          <span className="font-mono text-[10px] tracking-caps uppercase opacity-70">expand</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 z-20 bg-cream border border-flare shadow-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] text-flare tracking-caps uppercase mb-2">mandatory requirements · not found in resume</p>
                  <h3 className="font-chunk text-[clamp(1.75rem,3vw,2.25rem)] tracking-tight text-ink-900 leading-none">
                    <span className="num">{requirements.length}</span> hard blocker{requirements.length === 1 ? '' : 's'}{' '}
                    <span className="serif-accent text-flare italic">to address</span>
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-ink-900/5 transition-colors rounded-sm"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-ink-500" />
                </button>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
                className="space-y-3"
              >
                {requirements.map((req, i) => (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    className="border border-ink-200 bg-white p-4 sm:p-5 hover:border-flare/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-[9px] text-flare tracking-caps uppercase bg-flare/10 px-2 py-0.5 shrink-0">
                        {CATEGORY_LABEL[req.category] ?? req.category}
                      </span>
                      <p className="text-[13px] sm:text-[14px] font-bold text-ink-900 leading-snug">{req.requirement}</p>
                    </div>
                    <p className="text-[12px] text-ink-500 italic font-serif leading-relaxed border-l-2 border-flare/30 pl-3">
                      "{req.jdQuote}"
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              <p className="mt-6 font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                these are minimum qualifications — tailoring your resume may not be enough without addressing them directly
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
