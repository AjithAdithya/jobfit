import { callClaude, callClaudeStream, callClaudeWithTool, type ClaudeCallOptions } from './anthropic';
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

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5':          { input: 1.0e-6,  output: 5.0e-6  },
  'claude-haiku-4-5-20251001': { input: 1.0e-6,  output: 5.0e-6  },
  'claude-sonnet-4-6':         { input: 3.0e-6,  output: 15.0e-6 },
  'claude-opus-4-7':           { input: 15.0e-6, output: 75.0e-6 },
};

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash >>>= 0;
  }
  return hash.toString(16);
}

function estimateCost(model: string, inputChars: number, outputChars: number): number {
  const rates = MODEL_COSTS[model] ?? MODEL_COSTS['claude-sonnet-4-6'];
  const inputTokens = Math.ceil(inputChars / 4);
  const outputTokens = Math.ceil(outputChars / 4);
  return inputTokens * rates.input + outputTokens * rates.output;
}

// Resolves the current user from the cached Supabase session — never throws
async function resolveUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function persistLog(agentName: AgentName, payload: Record<string, unknown>): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) return;

  void supabase
    .from('generations')
    .insert({ user_id: userId, agent_name: agentName, ...payload })
    .then(({ error }) => {
      if (error) console.warn('Generation log insert failed:', error.message);
    });
}

// Drop-in logged replacement for callClaude
export async function callClaudeLogged(
  system: string,
  prompt: string,
  agentName: AgentName,
  options?: ClaudeCallOptions & { analysisHistoryId?: string }
): Promise<string> {
  const start = Date.now();
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
    void persistLog(agentName, {
      model_used: model,
      input_hash: djb2Hash(system + prompt),
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

// Drop-in logged replacement for callClaudeWithTool
export async function callClaudeWithToolLogged<T>(
  system: string,
  prompt: string,
  tool: Parameters<typeof callClaudeWithTool>[2],
  agentName: AgentName,
  options?: ClaudeCallOptions & { analysisHistoryId?: string }
): Promise<T> {
  const start = Date.now();
  const model = options?.model ?? 'claude-sonnet-4-6';
  let success = true;
  let errorMessage: string | undefined;
  let result: T | undefined;

  try {
    result = await callClaudeWithTool<T>(system, prompt, tool, options);
    return result;
  } catch (err: any) {
    success = false;
    errorMessage = err.message || String(err);
    throw err;
  } finally {
    const latencyMs = Date.now() - start;
    const outputStr = result !== undefined ? JSON.stringify(result) : '';
    const cost = estimateCost(model, system.length + prompt.length, outputStr.length);
    void persistLog(agentName, {
      model_used: model,
      input_hash: djb2Hash(system + prompt),
      output_length: outputStr.length,
      prompt_tokens: Math.ceil((system.length + prompt.length) / 4),
      completion_tokens: Math.ceil(outputStr.length / 4),
      latency_ms: latencyMs,
      cost_usd: cost,
      success,
      error_message: errorMessage ?? null,
      analysis_history_id: options?.analysisHistoryId ?? null,
    });
  }
}

// Drop-in logged replacement for callClaudeStream
export async function callClaudeStreamLogged(
  system: string,
  prompt: string,
  agentName: AgentName,
  onChunk: (text: string) => void,
  options?: ClaudeCallOptions & { analysisHistoryId?: string }
): Promise<void> {
  const start = Date.now();
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
    void persistLog(agentName, {
      model_used: model,
      input_hash: djb2Hash(system + prompt),
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
