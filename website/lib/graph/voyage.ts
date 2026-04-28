const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'

export async function generateEmbeddings(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY not set')
  if (!inputs.length) throw new Error('No inputs to embed')

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: inputs, model: 'voyage-3-large' }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Voyage API ${response.status}: ${data.detail || response.statusText}`)
  }
  if (Array.isArray(data.data)) return data.data.map((d: any) => d.embedding)
  if (Array.isArray(data.embeddings)) return data.embeddings
  throw new Error('Unexpected Voyage response shape')
}
