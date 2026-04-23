export interface MatchLevel {
  label: string;
  subtitle: string;
  textClass: string;
  gradientFrom: string;
  gradientTo: string;
  cardBg: string;
  cardBorder: string;
  glowClass: string;
  hex: string;
}

const LEVELS: Array<{ min: number } & MatchLevel> = [
  {
    min: 95,
    label: 'Elite Fit',
    subtitle: 'outstanding alignment',
    textClass: 'text-ink-900',
    gradientFrom: '#D7FF3A',
    gradientTo: '#9FBF25',
    cardBg: 'bg-citrus',
    cardBorder: 'border-ink-900',
    glowClass: 'bg-citrus',
    hex: '#9FBF25',
  },
  {
    min: 85,
    label: 'Excellent Fit',
    subtitle: 'highly competitive candidate',
    textClass: 'text-ink-900',
    gradientFrom: '#D7FF3A',
    gradientTo: '#B8D830',
    cardBg: 'bg-citrus/30',
    cardBorder: 'border-ink-900',
    glowClass: 'bg-citrus',
    hex: '#B8D830',
  },
  {
    min: 75,
    label: 'Great Fit',
    subtitle: 'well positioned for this role',
    textClass: 'text-ink-900',
    gradientFrom: '#5DD4FF',
    gradientTo: '#3BA8D4',
    cardBg: 'bg-sky/30',
    cardBorder: 'border-ink-900',
    glowClass: 'bg-sky',
    hex: '#3BA8D4',
  },
  {
    min: 65,
    label: 'Strong Fit',
    subtitle: 'solid qualifications across requirements',
    textClass: 'text-ink-900',
    gradientFrom: '#5DD4FF',
    gradientTo: '#3BA8D4',
    cardBg: 'bg-sky/20',
    cardBorder: 'border-ink-900',
    glowClass: 'bg-sky',
    hex: '#3BA8D4',
  },
  {
    min: 55,
    label: 'Decent Fit',
    subtitle: 'good base, a few gaps to bridge',
    textClass: 'text-ink-900',
    gradientFrom: '#A9AEB6',
    gradientTo: '#7B8088',
    cardBg: 'bg-ink-100',
    cardBorder: 'border-ink-900',
    glowClass: 'bg-ink-300',
    hex: '#7B8088',
  },
  {
    min: 45,
    label: 'Partial Fit',
    subtitle: 'notable gaps, tailoring recommended',
    textClass: 'text-flare',
    gradientFrom: '#FF8A6B',
    gradientTo: '#FF4D2E',
    cardBg: 'bg-flare/10',
    cardBorder: 'border-flare',
    glowClass: 'bg-flare',
    hex: '#FF4D2E',
  },
  {
    min: 35,
    label: 'Developing',
    subtitle: 'significant skill gaps present',
    textClass: 'text-flare',
    gradientFrom: '#FF4D2E',
    gradientTo: '#C0310A',
    cardBg: 'bg-flare/15',
    cardBorder: 'border-flare',
    glowClass: 'bg-flare',
    hex: '#E6421F',
  },
  {
    min: 25,
    label: 'Weak Fit',
    subtitle: 'major requirements missing',
    textClass: 'text-crimson-500',
    gradientFrom: '#E66B6B',
    gradientTo: '#C01414',
    cardBg: 'bg-crimson-50',
    cardBorder: 'border-crimson-500',
    glowClass: 'bg-crimson-500',
    hex: '#D63838',
  },
  {
    min: 10,
    label: 'Long Shot',
    subtitle: 'very few overlapping requirements',
    textClass: 'text-crimson-500',
    gradientFrom: '#C01414',
    gradientTo: '#7A0707',
    cardBg: 'bg-crimson-50',
    cardBorder: 'border-crimson-500',
    glowClass: 'bg-crimson-500',
    hex: '#C01414',
  },
  {
    min: 0,
    label: 'No Fit',
    subtitle: 'consider a different role',
    textClass: 'text-ink-500',
    gradientFrom: '#555A63',
    gradientTo: '#24272D',
    cardBg: 'bg-ink-100',
    cardBorder: 'border-ink-300',
    glowClass: 'bg-ink-400',
    hex: '#555A63',
  },
];

export function getMatchLevel(score: number): MatchLevel {
  const level = LEVELS.find(l => score >= l.min) ?? LEVELS[LEVELS.length - 1];
  const { min: _min, ...rest } = level;
  return rest;
}
