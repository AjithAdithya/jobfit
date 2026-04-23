import { callClaude, callClaudeStream, type ClaudeCallOptions } from './anthropic';
import { supabase } from './supabase';

export type AgentName =
  | 'analyzer'
  | 'synthesizer'
  | 'writer'
  | 'stylist'
  | 'cover_letter'
  | 'guardian'
  | 'haiku_prefilter'
  | 'planner';

// Estimated cost per token (USD). Using public Anthropic pricing.
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5':          { input: 1.0e-6,  output: 5.0e-6  },
  'claude-haiku-4-5-20251001': { input: 1.0e-6,  output: 5.0e-6  },
  'claude-sonnet-4-6':         { input: 3.0e-6,  output: 15.0e-6 },
  'claude-opus-4-7':           { input: 15.0e-6, output: 75.0e-6 },
};

// Simple djb2 hash — not cryptographic, just for deduplication/debugging
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash >>>= 0; // keep unsigned 32-bit
  }
  return hash.toString(16);
}

function estimateCost(model: string, inputChars: number, outputChars: number): number {
  const rates = MODEL_COSTS[model] ?? MODEL_COSTS['claude-sonnet-4-6'];
  const inputTokens = Math.ceil(inputChars / 4);
  const outputTokens = Math.ceil(outputChars / 4);
  return inputTokens * rates.input + outputTokens * rates.output;
}

async function persistLog(payload: Record<string, unknown>): Promise<void> {
  // Fire-and-forget — never await, never throw
  void supabase.from('generations')
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn('Generation log insert failed:', error.message);
    });
}

// Logged drop-in replacement for callClaude
export async function callClaudeLogged(
  system: string,
  prompt: string,
  agentName: AgentName,
  userId: string,
  options?: ClaudeCallOptions & { analysisHistoryId?: string }
): Promise<string> {
  const start = Date.now();
  const inputHash = djb2Hash(system + prompt);
  const model = options?.model ?? 'claude-sonnet-4-6';
  let success = true;
  let errorMessage: string | undefined;
  let result = '';

  try {
    result = await callClaude(system, prompt, options);
    return result;
  } catch (err: any) {
    success = false;
    errorMessage = err.message || String(err);
    throw err;
  } finally {
    const latencyMs = Date.now() - start;
    const cost = estimateCost(model, system.length + prompt.length, result.length);
    persistLog({
      user_id: userId,
      agent_name: agentName,
      model_used: model,
      input_hash: inputHash,
      output_length: result.length,
      prompt_tokens: Math.ceil((system.length + prompt.length) / 4),
      completion_tokens: Math.ceil(result.length / 4),
      latency_ms: latencyMs,
      cost_usd: cost,
      success,
      error_message: errorMessage ?? null,
      analysis_history_id: options?.analysisHistoryId ?? null,
    });
  }
}

// Logged streaming variant
export async function callClaudeStreamLogged(
  system: string,
  prompt: string,
  agentName: AgentName,
  userId: string,
  onChunk: (text: string) => void,
  options?: ClaudeCallOptions & { analysisHistoryId?: string }
): Promise<void> {
  const start = Date.now();
  const inputHash = djb2Hash(system + prompt);
  const model = options?.model ?? 'claude-opus-4-7';
  let success = true;
  let errorMessage: string | undefined;
  let outputLength = 0;

  const wrappedChunk = (text: string) => {
    outputLength += text.length;
    onChunk(text);
  };

  try {
    await callClaudeStream(system, prompt, wrappedChunk, options);
  } catch (err: any) {
    success = false;
    errorMessage = err.message || String(err);
    throw err;
  } finally {
    const latencyMs = Date.now() - start;
    const cost = estimateCost(model, system.length + prompt.length, outputLength);
    persistLog({
      user_id: userId,
      agent_name: agentName,
      model_used: model,
      input_hash: inputHash,
      output_length: outputLength,
      prompt_tokens: Math.ceil((system.length + prompt.length) / 4),
      completion_tokens: Math.ceil(outputLength / 4),
      latency_ms: latencyMs,
      cost_usd: cost,
      success,
      error_message: errorMessage ?? null,
      analysis_history_id: options?.analysisHistoryId ?? null,
    });
  }
}
