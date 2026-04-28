import { StateGraph, START, END } from '@langchain/langgraph'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ResumeGenState } from './state'
import type { ResumeGenStateType } from './state'
import {
  createRetrieveContextNode,
  createWriteResumeNode,
  createCritiqueNode,
  createGuardianNode,
  createPolishNode,
} from './nodes'

// ─── Routing constants ────────────────────────────────────────────────────────

const COVERAGE_THRESHOLD = 0.70   // below this → rewrite
const MAX_WRITER_RETRIES = 3      // hard cap on writer loops
const MAX_GUARDIAN_RETRIES = 2    // hard cap on guardian-triggered rewrites

// ─── Conditional edges ────────────────────────────────────────────────────────

/**
 * After critique:
 * - coverageScore < threshold AND retries not exhausted → back to writer
 * - otherwise → guardian
 */
function routeAfterCritique(state: ResumeGenStateType): 'rewrite' | 'safety' {
  const score = state.critique?.coverageScore ?? 1
  const retries = state.writerRetries ?? 0
  if (score < COVERAGE_THRESHOLD && retries < MAX_WRITER_RETRIES) {
    return 'rewrite'
  }
  return 'safety'
}

/**
 * After guardian:
 * - HIGH-confidence violations and retries not exhausted → back to writer with constraint hint
 * - otherwise → polish and finish
 */
function routeAfterGuardian(state: ResumeGenStateType): 'rewrite' | 'finish' {
  const result = state.guardianResult
  const retries = state.guardianRetries ?? 0
  if (result && !result.safe && retries < MAX_GUARDIAN_RETRIES) {
    const highConfidence = result.violations.some(v => v.confidence === 'HIGH')
    if (highConfidence) return 'rewrite'
  }
  return 'finish'
}

// ─── Graph factory ────────────────────────────────────────────────────────────

/**
 * Build and compile the resume generation graph.
 *
 * Flow:
 *   START
 *     → retrieve_context   (vector search + company research, parallel)
 *     → write_resume       (Writer: Sonnet)
 *     → critique           (Critic: Haiku — scores gap/keyword coverage + ATS)
 *         ├─ coverage < 0.70 && retries < 3  → write_resume (with rewriteHint)
 *         └─ coverage ok                     → guardian
 *     → guardian           (Safety validator: Haiku)
 *         ├─ HIGH violation && retries < 2   → write_resume (with violation hint injected)
 *         └─ safe                            → polish
 *     → polish             (Deterministic cleanup)
 *     → END
 */
export function buildResumeGraph(deps: { supabase: SupabaseClient }) {
  const graph = new StateGraph(ResumeGenState)
    .addNode('retrieve_context', createRetrieveContextNode(deps))
    .addNode('write_resume', createWriteResumeNode())
    .addNode('critique', createCritiqueNode())
    .addNode('guardian', createGuardianNode())
    .addNode('polish', createPolishNode())

    .addEdge(START, 'retrieve_context')
    .addEdge('retrieve_context', 'write_resume')
    .addEdge('write_resume', 'critique')
    .addConditionalEdges('critique', routeAfterCritique, {
      rewrite: 'write_resume',
      safety: 'guardian',
    })
    .addConditionalEdges('guardian', routeAfterGuardian, {
      rewrite: 'write_resume',
      finish: 'polish',
    })
    .addEdge('polish', END)

  return graph.compile()
}
