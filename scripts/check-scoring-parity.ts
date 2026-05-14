#!/usr/bin/env npx ts-node --esm
/**
 * CI parity checker — fails with exit code 1 if:
 * - SCORING_WEIGHTS in website/lib/scoring/types.ts diverge from src/lib/agents.ts
 * - ANALYZER_SYSTEM_PROMPT diverges between the two modules
 * - SYNTHESIZER_SYSTEM_PROMPT diverges between the two modules
 *
 * Run: npm run lint:scoring-parity
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function readFile(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

// ── Extract SCORING_WEIGHTS literal ──────────────────────────────────────────

function extractWeights(source: string): Record<string, number> {
  const match = source.match(/SCORING_WEIGHTS\s*=\s*\{([^}]+)\}/s)
  if (!match) throw new Error('SCORING_WEIGHTS not found')
  const weights: Record<string, number> = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/(\w+)\s*:\s*([\d.]+)/)
    if (kv) weights[kv[1]] = parseFloat(kv[2])
  }
  return weights
}

// ── Extract prompt string constants ──────────────────────────────────────────

function extractPrompt(source: string, name: string): string {
  // Match: const NAME = `...`  (template literal)
  const re = new RegExp(`(?:const|export const)\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\``, 'm')
  const match = source.match(re)
  if (!match) throw new Error(`${name} not found`)
  return match[1].trim()
}

// ── Main ──────────────────────────────────────────────────────────────────────

let failed = false

function check(label: string, a: unknown, b: unknown) {
  const aStr = JSON.stringify(a)
  const bStr = JSON.stringify(b)
  if (aStr !== bStr) {
    console.error(`\n[PARITY FAIL] ${label}`)
    console.error('  extension:', aStr)
    console.error('  website:  ', bStr)
    failed = true
  } else {
    console.log(`[ok] ${label}`)
  }
}

const extAgents   = readFile('src/lib/agents.ts')
const webTypes    = readFile('website/lib/scoring/types.ts')
const webPrompts  = readFile('website/lib/scoring/prompts.ts')

// Check weights
const extWeights = extractWeights(extAgents)
const webWeights = extractWeights(webTypes)
check('SCORING_WEIGHTS keys', Object.keys(extWeights).sort(), Object.keys(webWeights).sort())
for (const key of Object.keys(extWeights)) {
  check(`SCORING_WEIGHTS.${key}`, extWeights[key], webWeights[key])
}

// Check prompts
const extAnalyzerPrompt = extractPrompt(extAgents, 'ANALYZER_SYSTEM_PROMPT')
const webAnalyzerPrompt = extractPrompt(webPrompts, 'ANALYZER_SYSTEM_PROMPT')
check('ANALYZER_SYSTEM_PROMPT', extAnalyzerPrompt, webAnalyzerPrompt)

const extSynthPrompt = extractPrompt(extAgents, 'SYNTHESIZER_SYSTEM_PROMPT')
const webSynthPrompt = extractPrompt(webPrompts, 'SYNTHESIZER_SYSTEM_PROMPT')
check('SYNTHESIZER_SYSTEM_PROMPT', extSynthPrompt, webSynthPrompt)

if (failed) {
  console.error('\nScoring parity check FAILED — sync the diverged constants before merging.')
  process.exit(1)
} else {
  console.log('\nAll scoring parity checks passed.')
}
