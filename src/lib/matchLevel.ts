export interface MatchLevel {
  label: string;
  subtitle: string;
  textClass: string;
  gradientFrom: string;
  gradientTo: string;
  cardBg: string;
  cardBorder: string;
  glowClass: string;
}

const LEVELS: Array<{ min: number } & MatchLevel> = [
  {
    min: 95,
    label: 'Elite Match',
    subtitle: 'Outstanding alignment',
    textClass: 'text-cyan-300',
    gradientFrom: '#06b6d4',
    gradientTo: '#3b82f6',
    cardBg: 'from-cyan-600/10 to-blue-600/5',
    cardBorder: 'border-cyan-500/20',
    glowClass: 'bg-cyan-400',
  },
  {
    min: 85,
    label: 'Excellent Match',
    subtitle: 'Highly competitive candidate',
    textClass: 'text-emerald-300',
    gradientFrom: '#10b981',
    gradientTo: '#06b6d4',
    cardBg: 'from-emerald-600/10 to-cyan-600/5',
    cardBorder: 'border-emerald-500/20',
    glowClass: 'bg-emerald-400',
  },
  {
    min: 75,
    label: 'Great Match',
    subtitle: 'Well positioned for this role',
    textClass: 'text-green-300',
    gradientFrom: '#22c55e',
    gradientTo: '#10b981',
    cardBg: 'from-green-600/10 to-emerald-600/5',
    cardBorder: 'border-green-500/20',
    glowClass: 'bg-green-400',
  },
  {
    min: 65,
    label: 'Strong Fit',
    subtitle: 'Solid qualifications across requirements',
    textClass: 'text-lime-300',
    gradientFrom: '#84cc16',
    gradientTo: '#22c55e',
    cardBg: 'from-lime-600/10 to-green-600/5',
    cardBorder: 'border-lime-500/20',
    glowClass: 'bg-lime-400',
  },
  {
    min: 55,
    label: 'Decent Fit',
    subtitle: 'Good base, a few gaps to bridge',
    textClass: 'text-yellow-300',
    gradientFrom: '#eab308',
    gradientTo: '#84cc16',
    cardBg: 'from-yellow-600/10 to-lime-600/5',
    cardBorder: 'border-yellow-500/20',
    glowClass: 'bg-yellow-400',
  },
  {
    min: 45,
    label: 'Partial Match',
    subtitle: 'Notable gaps, tailoring recommended',
    textClass: 'text-amber-300',
    gradientFrom: '#f59e0b',
    gradientTo: '#eab308',
    cardBg: 'from-amber-600/10 to-yellow-600/5',
    cardBorder: 'border-amber-500/20',
    glowClass: 'bg-amber-400',
  },
  {
    min: 35,
    label: 'Developing',
    subtitle: 'Significant skill gaps present',
    textClass: 'text-orange-300',
    gradientFrom: '#f97316',
    gradientTo: '#f59e0b',
    cardBg: 'from-orange-600/10 to-amber-600/5',
    cardBorder: 'border-orange-500/20',
    glowClass: 'bg-orange-400',
  },
  {
    min: 25,
    label: 'Weak Fit',
    subtitle: 'Major requirements missing',
    textClass: 'text-red-300',
    gradientFrom: '#ef4444',
    gradientTo: '#f97316',
    cardBg: 'from-red-600/10 to-orange-600/5',
    cardBorder: 'border-red-500/20',
    glowClass: 'bg-red-400',
  },
  {
    min: 10,
    label: 'Long Shot',
    subtitle: 'Very few overlapping requirements',
    textClass: 'text-rose-300',
    gradientFrom: '#f43f5e',
    gradientTo: '#ef4444',
    cardBg: 'from-rose-600/10 to-red-600/5',
    cardBorder: 'border-rose-500/20',
    glowClass: 'bg-rose-400',
  },
  {
    min: 0,
    label: 'No Match',
    subtitle: 'Consider a different role',
    textClass: 'text-slate-400',
    gradientFrom: '#64748b',
    gradientTo: '#475569',
    cardBg: 'from-slate-600/10 to-transparent',
    cardBorder: 'border-slate-700/30',
    glowClass: 'bg-slate-500',
  },
];

export function getMatchLevel(score: number): MatchLevel {
  const level = LEVELS.find(l => score >= l.min) ?? LEVELS[LEVELS.length - 1];
  const { min: _min, ...rest } = level;
  return rest;
}
