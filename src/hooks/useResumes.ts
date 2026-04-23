import { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '../lib/supabase';
import { chunkText } from '../lib/processor';
import { generateEmbeddings } from '../lib/voyage';

// Use the locally bundled worker via Vite's ?url import
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const useResumes = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAndProcess = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`);
      }

      // 1. Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Parse PDF directly in the Side Panel (no offscreen document needed)
      console.log('Parsing PDF directly in Side Panel...');
      const arrayBuffer = await file.arrayBuffer();
      const text = await parsePdf(new Uint8Array(arrayBuffer));
      
      if (!text || text.trim().length === 0) {
        throw new Error('PDF appears to be empty or image-based. Please upload a text-based PDF.');
      }
      console.log(`PDF parsed successfully. Extracted ${text.length} characters.`);

      // 3. Chunk & Tag
      const chunks = chunkText(text);
      if (!chunks || chunks.length === 0) {
        throw new Error('Could not extract any content from the PDF.');
      }
      console.log(`Chunked into ${chunks.length} segments.`);

      // 4. Generate Embeddings
      const contents = chunks.map(c => c.content);
      const embeddings = await generateEmbeddings(contents);
      if (!embeddings || embeddings.length === 0) {
        throw new Error('Failed to generate embeddings. Please check your Voyage API key.');
      }
      console.log(`Generated ${embeddings.length} embeddings.`);

      // 5. Save to Resumes table
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          storage_path: fileName
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      // 6. Save chunks to resume_chunkies (pgvector)
      const chunkData = chunks.map((c, i) => ({
        resume_id: resume.id,
        user_id: user.id,
        section: c.section,
        content: c.content,
        embedding: embeddings[i]
      }));

      const { error: chunksError } = await supabase
        .from('resume_chunkies')
        .insert(chunkData);

      if (chunksError) throw chunksError;

      console.log('Resume processing complete!');
      return resume;

    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process resume');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return {
    uploadAndProcess,
    processing,
    error
  };
};

/**
 * Parse a PDF file directly using pdfjs-dist.
 * Runs in the Side Panel which has full DOM access — no offscreen document needed.
 */
async function parsePdf(data: Uint8Array): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  console.log(`PDF loaded: ${pdf.numPages} pages`);

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
