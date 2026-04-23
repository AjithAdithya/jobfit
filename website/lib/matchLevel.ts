export interface MatchLevel {
  label: string
  subtitle: string
  tone: 'crimson' | 'citrus' | 'flare' | 'sky' | 'ink'
  hex: string          /* dot / bar color */
  gradientFrom: string
  gradientTo: string
}

const LEVELS: Array<{ min: number } & MatchLevel> = [
  { min: 95, label: 'Elite fit',      subtitle: 'outstanding alignment',                       tone: 'citrus',  hex: '#9FBF25', gradientFrom: '#D7FF3A', gradientTo: '#9FBF25' },
  { min: 85, label: 'Excellent fit',  subtitle: 'highly competitive candidate',                tone: 'citrus',  hex: '#B8D830', gradientFrom: '#D7FF3A', gradientTo: '#B8D830' },
  { min: 75, label: 'Great fit',      subtitle: 'well positioned for this role',               tone: 'sky',     hex: '#5DD4FF', gradientFrom: '#5DD4FF', gradientTo: '#3BA8D4' },
  { min: 65, label: 'Strong fit',     subtitle: 'solid qualifications across requirements',    tone: 'sky',     hex: '#3BA8D4', gradientFrom: '#5DD4FF', gradientTo: '#3BA8D4' },
  { min: 55, label: 'Decent fit',     subtitle: 'good base, a few gaps to bridge',             tone: 'ink',     hex: '#7B8088', gradientFrom: '#A9AEB6', gradientTo: '#7B8088' },
  { min: 45, label: 'Partial fit',    subtitle: 'notable gaps, tailoring recommended',         tone: 'flare',   hex: '#FF4D2E', gradientFrom: '#FF8A6B', gradientTo: '#FF4D2E' },
  { min: 35, label: 'Developing',     subtitle: 'significant skill gaps present',              tone: 'flare',   hex: '#E6421F', gradientFrom: '#FF4D2E', gradientTo: '#C0310A' },
  { min: 25, label: 'Weak fit',       subtitle: 'major requirements missing',                  tone: 'crimson', hex: '#D63838', gradientFrom: '#E66B6B', gradientTo: '#C01414' },
  { min: 10, label: 'Long shot',      subtitle: 'very few overlapping requirements',           tone: 'crimson', hex: '#C01414', gradientFrom: '#C01414', gradientTo: '#7A0707' },
  { min: 0,  label: 'No fit',         subtitle: 'consider a different role',                   tone: 'ink',     hex: '#555A63', gradientFrom: '#555A63', gradientTo: '#24272D' },
]

export function getMatchLevel(score: number): MatchLevel {
  const level = LEVELS.find(l => score >= l.min) ?? LEVELS[LEVELS.length - 1]
  const { min: _min, ...rest } = level
  return rest
}

export const ALL_LEVELS = LEVELS
