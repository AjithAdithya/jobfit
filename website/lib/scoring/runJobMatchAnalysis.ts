// Server-side scoring entry point with full dependency injection.
// No chrome.storage, no browser globals — runs safely in Node / Vercel Edge.

import type { SupabaseClient } from '@supabase/supabase-js'
import { withRetry, type ToolDefinition } from '../graph/anthropic'
import { applyInputGuardrails, type SanitizationResult } from './guardrails'
import {
  ANALYZER_SYSTEM_PROMPT,
  ANALYZER_TOOL,
  SYNTHESIZER_SYSTEM_PROMPT,
  SYNTHESIZER_TOOL,
} from './prompts'
import {
  computeFinalScore,
  NotJobDescriptionError,
  type AnalysisResult,
  type SubScores,
} from './types'

export interface ScoringDeps {
  supabase: SupabaseClient
  userId: string
  resumeId: string
  /** Embed a batch of strings → 1024-dim vectors */
  embed: (texts: string[]) => Promise<number[][]>
  /** Call Claude with a tool; mirrors website/lib/graph/anthropic.ts signature */
  callClaude: <T>(
    system: string,
    prompt: string,
    tool: ToolDefinition,
    options?: { temperature?: number; maxTokens?: number }
  ) => Promise<T>
  /** Haiku classifier for guardrails; receives trimmed JD text */
  classifyInjection?: (text: string) => Promise<boolean>
}

export interface ScoringResult extends AnalysisResult {
  guardrailResult?: SanitizationResult
  notJDWarning?: string
}

export async function runJobMatchAnalysis(
  jobDescription: string,
  deps: ScoringDeps,
  opts?: { skipGuardrails?: boolean }
): Promise<ScoringResult> {
  const { supabase, userId, resumeId, embed, callClaude } = deps

  // ── Guardrails ─────────────────────────────────────────────────────────────
  let wrappedJD = jobDescription
  let guardrailResult: SanitizationResult | undefined

  if (!opts?.skipGuardrails) {
    const classifier = deps.classifyInjection ?? (async () => false)
    const guardrails = await applyInputGuardrails(jobDescription, classifier)
    wrappedJD = guardrails.wrappedText
    guardrailResult = guardrails.result
    if (guardrailResult.flagged) {
      console.warn('[scoring] guardrails flagged JD:', guardrailResult.flagReasons)
    }
  }

  // ── Analyzer — classify + extract top requirements ─────────────────────────
  type AnalyzerOutput = { isJobDescription: boolean; reason: string; requirements: string[] }

  const analyzerResult = await withRetry(() =>
    callClaude<AnalyzerOutput>(
      ANALYZER_SYSTEM_PROMPT,
      `Analyze this content:\n\n${wrappedJD}`,
      ANALYZER_TOOL,
      { temperature: 0 }
    )
  )

  let notJDWarning: string | undefined
  if (!analyzerResult.isJobDescription) {
    notJDWarning = analyzerResult.reason || 'This page may not be a job description.'
  }

  const requirements =
    Array.isArray(analyzerResult.requirements) && analyzerResult.requirements.length > 0
      ? analyzerResult.requirements
      : ['General qualifications']

  // ── Vector search against the user's resume chunks ────────────────────────
  const requirementEmbeddings = await embed(requirements)

  const searchResults = await Promise.all(
    requirementEmbeddings.map(embedding =>
      supabase
        .rpc('match_resume_chunkies', {
          query_embedding: embedding,
          match_threshold: 0.4,
          match_count: 2,
          p_resume_id: resumeId,
          p_user_id: userId,
        })
        .then(({ data, error }) => {
          if (error) throw new Error(error.message)
          return (data ?? []) as Array<{ content: string }>
        })
    )
  )

  const matchContexts = searchResults.flat().map(r => r.content)

  // ── Synthesizer — 9-dimension scoring ─────────────────────────────────────
  type SynthesizerOutput = {
    subscores: SubScores
    caps_applied: string[]
    confidence: 'low' | 'medium' | 'high'
    matches: string[]
    gaps: string[]
    keywords: string[]
  }

  const synthResult = await withRetry(() =>
    callClaude<SynthesizerOutput>(
      SYNTHESIZER_SYSTEM_PROMPT,
      `JOB REQUIREMENTS:\n${requirements.join('\n')}\n\nFULL JOB DESCRIPTION:\n${wrappedJD}\n\nUSER RESUME CONTEXT:\n${matchContexts.join('\n\n')}\n\nScore each of the 9 dimensions 0-100 and list any caps that apply.`,
      SYNTHESIZER_TOOL,
      { temperature: 0 }
    )
  )

  const subscores: SubScores = synthResult.subscores ?? {
    hard_skills: 0, experience_years: 0, domain: 0, seniority: 0,
    responsibility: 0, soft_skills: 0, education: 0, impact: 0, logistics: 0,
  }
  const caps = synthResult.caps_applied ?? []
  const finalScore = computeFinalScore(subscores, caps)

  if (notJDWarning) throw new NotJobDescriptionError(notJDWarning)

  return {
    score: finalScore,
    matches: synthResult.matches ?? [],
    gaps: synthResult.gaps ?? [],
    keywords: synthResult.keywords ?? [],
    subscores,
    caps_applied: caps,
    confidence: synthResult.confidence ?? 'medium',
    guardrailResult,
  }
}
