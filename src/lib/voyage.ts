export interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: {
    total_tokens: number;
  };
}

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

async function resolveVoyageKey(): Promise<string> {
  return new Promise(resolve => {
    chrome.storage.local.get('jobfit_voyage_key', (result) => {
      resolve(result.jobfit_voyage_key || import.meta.env.VITE_VOYAGE_API_KEY || '');
    });
  });
}

export async function generateEmbeddings(inputs: string[]): Promise<number[][]> {
  const apiKey = await resolveVoyageKey();
  if (!apiKey) {
    throw new Error('Voyage API key is missing. Add it in Settings or your .env file.');
  }

  if (!inputs || inputs.length === 0) {
    throw new Error('No content to generate embeddings for.');
  }

  console.log(`Voyage: Generating embeddings for ${inputs.length} chunks...`);
  console.log(`Voyage: Key prefix: ${apiKey.substring(0, 5)}...`);

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: inputs,
      model: 'voyage-3-large',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Voyage API Error Status:', response.status);
    console.error('Voyage API Error Body:', JSON.stringify(data, null, 2));
    throw new Error(`Voyage API failed (${response.status}): ${data.detail || data.message || response.statusText}`);
  }

  console.log('Voyage API Raw Response Keys:', Object.keys(data));

  // Handle both possible response formats
  if (data.data && Array.isArray(data.data)) {
    // OpenAI-compatible format: { data: [{ embedding: [...] }] }
    return data.data.map((item: any) => item.embedding);
  } else if (data.embeddings && Array.isArray(data.embeddings)) {
    // Legacy format: { embeddings: [[...]] }
    return data.embeddings;
  }

  console.error('Unexpected Voyage response format:', JSON.stringify(data, null, 2));
  throw new Error('Voyage API returned an unexpected response format.');
}
