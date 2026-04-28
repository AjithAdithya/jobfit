import { Annotation } from '@langchain/langgraph'

export interface CompanyResearch {
  overview: string
  stage: string
  techStack: string[]
  culture: string
  recentDevelopments: string
}

export interface CritiqueResult {
  coverageScore: number
  missingGaps: string[]
  missingKeywords: string[]
  atsIssues: string[]
  rewriteHint: string
}

export interface GuardianViolation {
  type: 'FABRICATED_CREDENTIAL' | 'LEAKED_SYSTEM_PROMPT' | 'INJECTED_INSTRUCTION' | 'SUSPICIOUS_URL' | 'POLICY_VIOLATION'
  excerpt: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface GuardianResult {
  safe: boolean
  violations: GuardianViolation[]
}

export const ResumeGenState = Annotation.Root({
  jobTitle: Annotation<string>(),
  companyName: Annotation<string>(),
  selectedGaps: Annotation<string[]>(),
  selectedKeywords: Annotation<string[]>(),
  userId: Annotation<string>(),
  userFeedback: Annotation<string | undefined>(),

  resumeContext: Annotation<string>(),
  companyContext: Annotation<CompanyResearch | null>(),

  generatedHtml: Annotation<string>(),
  critique: Annotation<CritiqueResult | null>(),
  guardianResult: Annotation<GuardianResult | null>(),

  writerRetries: Annotation<number>(),
  guardianRetries: Annotation<number>(),
})

export type ResumeGenStateType = typeof ResumeGenState.State
