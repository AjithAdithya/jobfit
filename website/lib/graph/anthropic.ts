export interface ClaudeOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

const FALLBACK_MODELS = [
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'claude-sonnet-4-6',
]

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  return key
}

export async function callClaudeWithTool<T>(
  system: string,
  prompt: string,
  tool: ToolDefinition,
  options: ClaudeOptions = {}
): Promise<T> {
  const apiKey = getApiKey()
  const maxTokens = options.maxTokens ?? 4096
  const models = options.model ? [options.model] : FALLBACK_MODELS
  let lastError: Error | null = null

  for (const model of models) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(options.temperature !== undefined && { temperature: options.temperature }),
          system,
          messages: [{ role: 'user', content: prompt }],
          tools: [tool],
          tool_choice: { type: 'tool', name: tool.name },
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        lastError = new Error(data.error?.message || `Anthropic API ${response.status}`)
        if (response.status === 404 || data.error?.type === 'not_found_error') continue
        throw lastError
      }
      const block = data.content?.find((b: any) => b.type === 'tool_use' && b.name === tool.name)
      if (block?.input) return block.input as T
      throw new Error(`No ${tool.name} tool_use block in response`)
    } catch (err: any) {
      lastError = err
      if (err.message?.includes('404') || err.message?.includes('not_found')) continue
      throw err
    }
  }
  throw lastError ?? new Error('All Claude models failed')
}

export async function callClaudeText(
  system: string,
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const apiKey = getApiKey()
  const maxTokens = options.maxTokens ?? 4096
  const model = options.model ?? 'claude-sonnet-4-6'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || `Anthropic API ${response.status}`)
  }
  return data.content?.[0]?.text ?? ''
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError!: Error
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt))
      }
    }
  }
  throw lastError
}
