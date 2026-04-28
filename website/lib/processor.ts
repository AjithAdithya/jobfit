export interface Chunk {
  content: string
  section: string
}

const SECTIONS = [
  { title: 'experience', regex: /(EXPERIENCE|WORK HISTORY|PROFESSIONAL BACKGROUND)/i },
  { title: 'skills', regex: /(SKILLS|TECHNOLOGIES|TECHNICAL PROFICIENCY)/i },
  { title: 'education', regex: /(EDUCATION|ACADEMIC BACKGROUND)/i },
  { title: 'projects', regex: /(PROJECTS|PERSONAL WORK)/i },
]

export function chunkText(text: string, chunkSize = 512, overlap = 64): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const content = text.slice(start, end).trim()
    let section = 'general'
    for (const s of SECTIONS) {
      if (s.regex.test(content)) { section = s.title; break }
    }
    if (content) chunks.push({ content, section })
    start += chunkSize - overlap
  }
  return chunks
}
