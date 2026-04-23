import { supabase } from './supabase';

export interface MatchResult {
  id: string;
  resume_id: string;
  section: string;
  content: string;
  similarity: number;
}

/**
 * Searches for the most relevant resume segments based on a query embedding.
 */
export async function searchResumeChunks(embedding: number[], threshold = 0.5, count = 10): Promise<MatchResult[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('match_resume_chunkies', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count,
    p_user_id: user.id
  });

  if (error) {
    console.error('Vector search error:', error);
    throw error;
  }

  return (data as MatchResult[]) ?? [];
}
