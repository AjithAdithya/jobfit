import React from 'react';
import { motion } from 'framer-motion';
import { getMatchLevel } from '../lib/matchLevel';

interface MatchCircleProps {
  score: number;
}

const MatchCircle: React.FC<MatchCircleProps> = ({ score }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { gradientFrom, gradientTo } = getMatchLevel(score);
  const gradientId = `matchGradient-${score}`;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
        <circle
          cx="48" cy="48" r={radius}
          stroke="currentColor" strokeWidth="4" fill="transparent"
          className="text-ink-200"
        />
        <motion.circle
          cx="48" cy="48" r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-chunk text-[32px] leading-none tracking-tight text-ink-900">{score}</span>
        <span className="font-mono text-[8px] font-medium text-ink-400 uppercase tracking-caps mt-0.5">fit%</span>
      </div>
    </div>
  );
};

export default MatchCircle;
