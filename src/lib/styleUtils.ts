import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ResumeStyle } from './types';
import { applyStyleToResumeHTML } from './agents';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// A4 at 96 dpi: 210mm × 297mm
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

// ─── PDF style extraction ────────────────────────────────────────────────────

export interface PdfStyleData {
  dominantFont: string;
  bodyFontSize: number;
  headingFontSize: number;
  nameFontSize: number;
  lineSpacing: number;
  leftMarginPt: number;
  pageCount: number;
  textSample: string;
}

export async function extractPdfStyleData(file: File): Promise<PdfStyleData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  interface TextItem { str: string; fontName: string; height: number; transform: number[] }
  const items = (textContent.items as TextItem[]).filter(i => i.str.trim().length > 0);

  const fontSizeCount = new Map<number, number>();
  const fontNameCount = new Map<string, number>();
  let textSample = '';

  for (const item of items) {
    const sizePt = Math.round(item.height);
    if (sizePt > 0 && sizePt < 72) {
      fontSizeCount.set(sizePt, (fontSizeCount.get(sizePt) || 0) + 1);
    }
    // PDF font names often look like "ABCDEF+Arial-Bold" — extract the readable part
    const clean = (item.fontName || '')
      .replace(/^[A-Z]{6}\+/, '')
      .replace(/[-_](Bold|Italic|Regular|Light|Medium|Black|Semibold).*/i, '')
      .trim();
    if (clean.length > 1) fontNameCount.set(clean, (fontNameCount.get(clean) || 0) + 1);
    if (textSample.length < 600) textSample += item.str + ' ';
  }

  // Body = most frequent size; heading/name = next larger unique sizes
  const byFreq = [...fontSizeCount.entries()].sort((a, b) => b[1] - a[1]);
  const bySize = [...fontSizeCount.entries()].sort((a, b) => b[0] - a[0]);
  const bodyFontSize = byFreq[0]?.[0] || 11;
  const largerSizes = bySize.map(e => e[0]).filter(s => s > bodyFontSize);
  const headingFontSize = largerSizes[1] || Math.max(bodyFontSize + 2, 12);
  const nameFontSize = largerSizes[0] || Math.max(bodyFontSize + 6, 18);

  const dominantFont = [...fontNameCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Arial';

  // Estimate left margin from minimum x offset of text items
  const xVals = items.filter(i => i.transform[4] > 0).map(i => i.transform[4]);
  const leftMarginPt = xVals.length ? Math.min(...xVals) : 72;

  // Estimate line spacing from consecutive y-diffs
  const ySorted = items.map(i => i.transform[5]).sort((a, b) => b - a);
  const diffs: number[] = [];
  for (let i = 1; i < Math.min(ySorted.length, 30); i++) {
    const d = ySorted[i - 1] - ySorted[i];
    if (d > 0 && d < 30) diffs.push(d);
  }
  const avgDiff = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : bodyFontSize * 1.4;
  const lineSpacing = Math.round((avgDiff / bodyFontSize) * 10) / 10;

  return {
    dominantFont,
    bodyFontSize: Math.max(9, Math.min(12, bodyFontSize)),
    headingFontSize: Math.max(11, Math.min(14, headingFontSize)),
    nameFontSize: Math.max(16, Math.min(24, nameFontSize)),
    lineSpacing: Math.max(1.0, Math.min(1.8, lineSpacing)),
    leftMarginPt,
    pageCount: pdf.numPages,
    textSample: textSample.slice(0, 600),
  };
}

// ─── A4 fitting utilities ────────────────────────────────────────────────────

// Render HTML in a fixed-width off-screen div and return its pixel height.
export function measureResumeHeight(html: string): number {
  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed',
    'top:-99999px',
    'left:-99999px',
    `width:${A4_WIDTH_PX}px`,
    'visibility:hidden',
    'pointer-events:none',
    'overflow:visible',
    'box-sizing:border-box',
  ].join(';');
  div.innerHTML = html;
  document.body.appendChild(div);
  const height = div.scrollHeight;
  document.body.removeChild(div);
  return height;
}

// Return true if the styled HTML fits within one A4 page.
export function fitsOnA4(html: string): boolean {
  return measureResumeHeight(html) <= A4_HEIGHT_PX;
}

// Nudge style values slightly tighter based on how far over A4 the content is.
function tightenStep(style: ResumeStyle, height: number): ResumeStyle {
  // Partial correction per iteration — avoid overshooting
  const overshoot = height / A4_HEIGHT_PX;
  const factor = Math.max(0.91, 1 - (overshoot - 1) * 0.45);
  return {
    ...style,
    fontSize: {
      name:    Math.max(14,  style.fontSize.name    * factor),
      heading: Math.max(10,  style.fontSize.heading * factor),
      body:    Math.max(8.5, style.fontSize.body    * factor),
    },
    spacing: {
      section:    Math.max(3,   style.spacing.section    * factor),
      item:       Math.max(1,   style.spacing.item        * factor),
      lineHeight: Math.max(1.0, style.spacing.lineHeight  * factor),
    },
  };
}

/**
 * Apply style and iteratively shrink until the resume fits on one A4 page.
 * Returns the final styled HTML.
 */
export function applyStyleAndFitA4(rawHtml: string, style: ResumeStyle): string {
  let currentStyle = style;
  let html = applyStyleToResumeHTML(rawHtml, currentStyle);

  for (let attempt = 0; attempt < 9; attempt++) {
    const height = measureResumeHeight(html);
    if (height <= A4_HEIGHT_PX) break;
    currentStyle = tightenStep(currentStyle, height);
    html = applyStyleToResumeHTML(rawHtml, currentStyle);
  }

  // Last resort: CSS scale to guarantee single page in print
  const finalHeight = measureResumeHeight(html);
  if (finalHeight > A4_HEIGHT_PX) {
    const scale = A4_HEIGHT_PX / finalHeight;
    html = html.replace(
      /class="jobfit-resume"/,
      `class="jobfit-resume" data-scaled="true" style="transform-origin:top left;transform:scaleY(${scale.toFixed(4)})"`
    );
  }

  return html;
}
