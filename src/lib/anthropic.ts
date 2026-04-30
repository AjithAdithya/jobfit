export interface ClaudeCallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('MISSING_API_KEY');
    this.name = 'MissingApiKeyError';
  }
}

async function resolveAnthropicKey(): Promise<string> {
  return new Promise(resolve => {
    chrome.storage.local.get('jobfit_anthropic_key', (result) => {
      resolve((result.jobfit_anthropic_key as string) || '');
    });
  });
}

const FALLBACK_MODELS = [
  "claude-haiku-4-5",
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
  "claude-sonnet-4-6"
];

export async function callClaude(
  system: string,
  prompt: string,
  options?: ClaudeCallOptions
): Promise<string> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey) throw new MissingApiKeyError();

  const maxTokens = options?.maxTokens ?? 4096;
  const models = options?.model ? [options.model] : FALLBACK_MODELS;
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`--- CLAUDE FETCH --- model: ${model}`);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(options?.temperature !== undefined && { temperature: options.temperature }),
          system,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Model ${model} returned ${response.status}:`, data);
        lastError = new Error(data.error?.message || `API Error ${response.status}`);
        if (response.status === 404 || data.error?.type === 'not_found_error') {
          continue;
        }
        throw lastError;
      }

      if (data.content?.[0]?.text) {
        return data.content[0].text;
      }

      throw new Error('Unexpected response format from Claude');
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('404') || error.message?.includes('not_found')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('All Claude models failed to respond');
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export async function callClaudeWithTool<T>(
  system: string,
  prompt: string,
  tool: ToolDefinition,
  options?: ClaudeCallOptions
): Promise<T> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey) throw new MissingApiKeyError();

  const maxTokens = options?.maxTokens ?? 4096;
  const models = options?.model ? [options.model] : FALLBACK_MODELS;
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`--- CLAUDE TOOL FETCH --- model: ${model}, tool: ${tool.name}`);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(options?.temperature !== undefined && { temperature: options.temperature }),
          system,
          messages: [{ role: "user", content: prompt }],
          tools: [tool],
          tool_choice: { type: "tool", name: tool.name },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Model ${model} returned ${response.status}:`, data);
        lastError = new Error(data.error?.message || `API Error ${response.status}`);
        if (response.status === 404 || data.error?.type === 'not_found_error') {
          continue;
        }
        throw lastError;
      }

      const toolBlock = data.content?.find((b: any) => b.type === 'tool_use' && b.name === tool.name);
      if (toolBlock?.input) return toolBlock.input as T;

      throw new Error(`No ${tool.name} tool_use block in response`);
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('404') || error.message?.includes('not_found')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('All Claude models failed to respond');
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError!: Error;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err instanceof MissingApiKeyError) throw err;
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

// Streaming version — calls onChunk for each text delta as it arrives
export async function callClaudeStream(
  system: string,
  prompt: string,
  onChunk: (text: string) => void,
  options?: ClaudeCallOptions
): Promise<void> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey) throw new MissingApiKeyError();

  const model = options?.model ?? 'claude-sonnet-4-6';
  const maxTokens = options?.maxTokens ?? 4096;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Streaming API Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body for streaming request');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;

      try {
        const event = JSON.parse(payload);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          onChunk(event.delta.text);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }
}
