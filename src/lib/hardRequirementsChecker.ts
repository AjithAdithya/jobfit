import { withRetry } from './anthropic'
import { callClaudeWithToolLogged } from './logger'

export interface HardRequirement {
  requirement: string
  jdQuote: string
  category: 'experience' | 'skill' | 'education' | 'certification' | 'other'
}

const SYSTEM = `You are a strict job requirements analyst.

Given a job description and a candidate's resume, identify ONLY hard requirements (mandatory minimum qualifications) that are clearly MISSING from the resume.

Rules:
- ONLY include requirements explicitly marked as mandatory: "required", "must have", "must", "minimum", "you must", "essential", "mandatory", or listed under a "Minimum Qualifications / Requirements" section.
- SKIP anything labeled "preferred", "bonus", "nice to have", "a plus", "ideally", "desired", or "advantageous".
- For each missing requirement, quote the EXACT phrase from the JD that makes it mandatory.
- Only flag requirements that are CLEARLY ABSENT from the resume — do not flag things that could be reasonably inferred or are partially demonstrated.
- Return a maximum of 6 items. Return an empty array if the candidate meets all hard requirements.`

const TOOL = {
  name: 'identify_missing_hard_requirements',
  description: 'Identify hard requirements from the JD that are clearly missing from the resume.',
  input_schema: {
    type: 'object' as const,
    properties: {
      hardRequirements: {
        type: 'array',
        description: 'Missing mandatory requirements. Empty array if none are missing.',
        items: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: 'Short label, e.g. "5+ years Python" or "AWS Solutions Architect cert"',
            },
            jdQuote: {
              type: 'string',
              description: 'Exact verbatim phrase from the JD proving this requirement is mandatory',
            },
            category: {
              type: 'string',
              enum: ['experience', 'skill', 'education', 'certification', 'other'],
            },
          },
          required: ['requirement', 'jdQuote', 'category'],
        },
      },
    },
    required: ['hardRequirements'],
  },
}

export async function runHardRequirementsCheck(
  jdText: string,
  resumeText: string
): Promise<HardRequirement[]> {
  try {
    type Output = { hardRequirements: HardRequirement[] }
    const result = await withRetry(() =>
      callClaudeWithToolLogged<Output>(
        SYSTEM,
        `JOB DESCRIPTION:\n${jdText.slice(0, 6000)}\n\nCANDIDATE RESUME:\n${resumeText.slice(0, 4000)}\n\nIdentify hard requirements that are clearly missing from the resume.`,
        TOOL,
        'hard_reqs_checker',
        { temperature: 0, model: 'claude-haiku-4-5' }
      )
    )
    return Array.isArray(result.hardRequirements) ? result.hardRequirements.slice(0, 6) : []
  } catch (err) {
    console.warn('[hardRequirementsChecker] failed:', err)
    return []
  }
}
