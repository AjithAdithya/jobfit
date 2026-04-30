export type KeyStatus = 'valid' | 'invalid' | 'error'

export async function validateAnthropicKey(key: string): Promise<KeyStatus> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    if (res.status === 401 || res.status === 403) return 'invalid'
    if (res.ok || res.status === 529) return 'valid' // 529 = overloaded but key is valid
    return 'invalid'
  } catch {
    return 'error'
  }
}

export async function validateVoyageKey(key: string): Promise<KeyStatus> {
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: 'voyage-3-lite', input: ['test'] }),
    })
    if (res.status === 401 || res.status === 403) return 'invalid'
    if (res.ok) return 'valid'
    return 'invalid'
  } catch {
    return 'error'
  }
}
