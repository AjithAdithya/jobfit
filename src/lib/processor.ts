export interface Chunk {
  content: string;
  section: string;
}

/**
 * Basic recursive character splitter for chunking resume text.
 * Aims for ~512 characters with some overlap.
 */
export function chunkText(text: string, chunkSize = 512, overlap = 64): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;

  // Extremely basic implementation of section detection
  // In a real app, this would use a small LLM or regex rules
  const sections = [
    { title: 'EXPERIENCE', regex: /(EXPERIENCE|WORK HISTORY|PROFESSIONAL BACKGROUND)/i },
    { title: 'SKILLS', regex: /(SKILLS|TECHNOLOGIES|TECHNICAL PROFICIENCY)/i },
    { title: 'EDUCATION', regex: /(EDUCATION|ACADEMIC BACKGROUND)/i },
    { title: 'PROJECTS', regex: /(PROJECTS|PERSONAL WORK)/i },
  ];

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end).trim();
    
    // Simple heuristic for section tagging
    let section = 'general';
    for (const s of sections) {
      if (s.regex.test(content)) {
        section = s.title.toLowerCase();
        break;
      }
    }

    if (content) {
      chunks.push({ content, section });
    }
    
    start += chunkSize - overlap;
  }

  return chunks;
}
