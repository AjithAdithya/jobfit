import { PDFParse } from 'pdf-parse'

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  const text = result.text?.trim()
  if (!text) throw new Error('PDF appears to be empty or image-based. Upload a text-based PDF.')
  return text
}
