// Server-side port of src/lib/guardrails.ts.
// The Haiku classifier is injected rather than importing callClaude directly,
// so this module remains testable without live API keys.

export interface SanitizationResult {
  clean: string;
  flagged: boolean;
  flagReasons: string[];
  truncated: boolean;
}

const INJECTION_PHRASES = [
  'ignore previous instructions',
  'ignore all instructions',
  'disregard previous',
  'disregard all',
  'system prompt',
  'you are now',
  'act as',
  'roleplay as',
  'new instructions',
  'forget everything',
  'override instructions',
  'your new task',
  'ignore the above',
  'do not follow',
  'instead of',
];

const ZERO_WIDTH_RE = /[​-‍﻿­⁠]/g;
const INVISIBLE_CSS_RE = /style\s*=\s*["'][^"']*(?:color\s*:\s*(?:white|#fff(?:fff)?)\b|font-size\s*:\s*0|display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["']/gi;
const BASE64_RE = /[A-Za-z0-9+/]{100,}={0,2}/;

export function sanitizeJD(raw: string, maxLength = 20000): SanitizationResult {
  const reasons: string[] = [];

  let clean = raw.normalize('NFKC');

  const before = clean.length;
  clean = clean.replace(ZERO_WIDTH_RE, '');
  if (clean.length < before) reasons.push('Stripped zero-width/invisible characters');

  if (INVISIBLE_CSS_RE.test(clean)) {
    clean = clean.replace(INVISIBLE_CSS_RE, '');
    reasons.push('Stripped invisible CSS attributes');
  }
  INVISIBLE_CSS_RE.lastIndex = 0;

  if (BASE64_RE.test(clean)) {
    reasons.push('Contains base64-encoded blob — possible obfuscation');
  }

  const lower = clean.toLowerCase();
  for (const phrase of INJECTION_PHRASES) {
    if (lower.includes(phrase)) {
      reasons.push(`Contains potential injection phrase: "${phrase}"`);
      break;
    }
  }

  const truncated = clean.length > maxLength;
  if (truncated) {
    clean = clean.slice(0, maxLength);
    reasons.push(`Truncated to ${maxLength.toLocaleString()} characters`);
  }

  return { clean: clean.trim(), flagged: reasons.length > 0, flagReasons: reasons, truncated };
}

export function wrapInXML(sanitizedText: string): string {
  return `<untrusted_job_description>\n${sanitizedText}\n</untrusted_job_description>`;
}

export async function applyInputGuardrails(
  raw: string,
  claudeHaikuClassify: (text: string) => Promise<boolean>
): Promise<{ wrappedText: string; result: SanitizationResult }> {
  const result = sanitizeJD(raw);

  try {
    const injectionDetected = await claudeHaikuClassify(result.clean);
    if (injectionDetected) {
      result.flagged = true;
      result.flagReasons.push('Haiku classifier: likely prompt injection detected');
    }
  } catch (err) {
    console.warn('Haiku pre-filter failed, proceeding without it:', err);
  }

  const wrappedText = wrapInXML(result.clean);
  return { wrappedText, result };
}
