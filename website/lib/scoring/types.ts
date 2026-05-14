// Pure types and scoring math — no I/O, safe to import anywhere.

export interface SubScores {
  hard_skills: number;
  experience_years: number;
  domain: number;
  seniority: number;
  responsibility: number;
  soft_skills: number;
  education: number;
  impact: number;
  logistics: number;
}

export interface AnalysisResult {
  score: number;
  matches: string[];
  gaps: string[];
  keywords: string[];
  subscores?: SubScores;
  caps_applied?: string[];
  confidence?: 'low' | 'medium' | 'high';
}

export const SCORING_WEIGHTS = {
  hard_skills:      0.25,
  experience_years: 0.15,
  domain:           0.10,
  seniority:        0.10,
  responsibility:   0.15,
  soft_skills:      0.05,
  education:        0.05,
  impact:           0.10,
  logistics:        0.05,
} as const;

export function computeFinalScore(sub: SubScores, caps: string[]): number {
  const weighted =
      SCORING_WEIGHTS.hard_skills      * sub.hard_skills
    + SCORING_WEIGHTS.experience_years * sub.experience_years
    + SCORING_WEIGHTS.domain           * sub.domain
    + SCORING_WEIGHTS.seniority        * sub.seniority
    + SCORING_WEIGHTS.responsibility   * sub.responsibility
    + SCORING_WEIGHTS.soft_skills      * sub.soft_skills
    + SCORING_WEIGHTS.education        * sub.education
    + SCORING_WEIGHTS.impact           * sub.impact
    + SCORING_WEIGHTS.logistics        * sub.logistics;

  let score = Math.max(0, Math.min(100, Math.round(weighted)));

  for (const cap of caps) {
    if (cap.startsWith('missing_must_have:')) score = Math.min(score, 65);
    else if (cap === 'missing_required_cert') score = Math.min(score, 70);
    else if (cap === 'visa_blocker')          score = Math.min(score, 40);
    else if (cap === 'yoe_short_3plus')       score = Math.min(score, 70);
    else if (cap === 'no_metrics')            score = Math.max(0, score - 5);
  }
  return score;
}

export class NotJobDescriptionError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super('NOT_JOB_DESCRIPTION');
    this.name = 'NotJobDescriptionError';
    this.reason = reason;
  }
}
