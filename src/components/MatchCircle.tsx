import React from 'react';
import { motion } from 'framer-motion';
import { getMatchLevel } from '../lib/matchLevel';

interface MatchCircleProps {
  score: number;
}

const MatchCircle: React.FC<MatchCircleProps> = ({ score }) => {
  const level = getMatchLevel(score);
  const filledSegments = Math.round(score / 10);

  // Split label so last word gets serif-accent treatment
  const words = level.label.split(' ');
  const accentWord = words.pop()!;
  const labelRest = words.join(' ');

  return (
    <div className="w-full">
      {/* Header row: label left, score number right */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink-500 mb-2">compatibility</p>
          <h2 className="font-chunk text-[26px] leading-none text-ink-900 tracking-tight">
            {labelRest && <>{labelRest} </>}
            <span className="serif-accent text-crimson-500">{accentWord}</span>
          </h2>
          <p className="text-[11px] text-ink-500 italic font-serif mt-1.5 leading-snug">{level.subtitle}</p>
        </div>
        <div className="flex items-baseline gap-0.5 shrink-0">
          <span className="num font-chunk text-[52px] leading-none text-ink-900">{score}</span>
          <span className="num text-[13px] text-ink-400 self-end mb-1">/100</span>
        </div>
      </div>

      {/* Segmented level bar */}
      <div className="flex gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="h-[5px] flex-1"
            style={{ backgroundColor: i < filledSegments ? level.gradientFrom : 'var(--ink-200)' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.18, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="num text-[9px] text-ink-400 uppercase tracking-caps">no fit</span>
        <span className="num text-[9px] text-ink-700 font-medium uppercase tracking-caps">elite</span>
      </div>
    </div>
  );
};

export default MatchCircle;
