'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertCircle, X } from 'lucide-react'
import { mapGapsToGeneric } from '@/lib/genericGaps'

export default function MissingRequirementsRibbon({ gaps }: { gaps: string[] }) {
  const [open, setOpen] = useState(false)
  if (!gaps || gaps.length === 0) return null

  const tiles = mapGapsToGeneric(gaps)

  return (
    <div className="relative mb-3">
      {/* Collapsed ribbon */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-6 py-3 bg-flare/10 border border-flare/40 hover:bg-flare/15 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-flare" />
          <span className="font-mono text-[11px] text-flare tracking-caps uppercase">
            <span className="num">{gaps.length}</span> missing requirement{gaps.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-flare">
          <span className="font-mono text-[10px] tracking-caps uppercase opacity-70">expand</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </div>
      </button>

      {/* Expanded overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 z-20 bg-cream border border-flare shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] text-flare tracking-caps uppercase mb-2">missing requirements</p>
                  <h3 className="font-chunk text-[clamp(1.75rem,3vw,2.25rem)] tracking-tight text-ink-900 leading-none">
                    <span className="num">{gaps.length}</span> gap{gaps.length === 1 ? '' : 's'} <span className="serif-accent text-flare italic">to address</span>
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

              {/* Generic tiles */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
                }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
              >
                {tiles.map(tile => (
                  <motion.div
                    key={tile.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="border border-ink-200 bg-white p-4 hover:border-flare/60 transition-colors"
                  >
                    <p className="font-mono text-[10px] text-flare tracking-caps uppercase mb-2">{tile.label}</p>
                    <p className="text-[12px] text-ink-500 italic font-serif leading-snug">{tile.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <p className="mt-6 font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                addressing these in your tailored resume can lift your match score
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
