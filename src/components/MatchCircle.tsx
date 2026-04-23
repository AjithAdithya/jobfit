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
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48" cy="48" r={radius}
          stroke="currentColor" strokeWidth="6" fill="transparent"
          className="text-slate-800"
        />
        <motion.circle
          cx="48" cy="48" r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
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
        <span className="text-2xl font-black text-white leading-none">{score}</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Fit %</span>
      </div>
    </div>
  );
};

export default MatchCircle;
