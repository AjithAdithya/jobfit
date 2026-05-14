// Regex-based role family inference. Falls back to 'other' when nothing matches.
// Keep patterns ordered most-specific → least-specific.

interface FamilyRule {
  family: string
  patterns: RegExp[]
}

const RULES: FamilyRule[] = [
  {
    family: 'ml-ai',
    patterns: [/machine\s*learning|ml\s+engineer|ai\s+engineer|llm|nlp|deep\s+learn|computer\s+vision|data\s+scientist/i],
  },
  {
    family: 'data',
    patterns: [/data\s+engineer|analytics\s+engineer|data\s+analyst|bi\s+engineer|etl|dbt|spark|airflow/i],
  },
  {
    family: 'platform',
    patterns: [/platform\s+engineer|infrastructure|devops|sre|site\s+reliab|cloud\s+engineer|kubernetes|k8s|terraform/i],
  },
  {
    family: 'security',
    patterns: [/security\s+engineer|appsec|devsecops|penetration|red\s+team|threat|soc\s+analyst/i],
  },
  {
    family: 'mobile',
    patterns: [/ios\s+engineer|android\s+engineer|mobile\s+engineer|react\s+native|flutter|swift|kotlin/i],
  },
  {
    family: 'frontend',
    patterns: [/front[\s-]?end|ui\s+engineer|react\s+developer|angular|vue|web\s+developer/i],
  },
  {
    family: 'backend',
    patterns: [/back[\s-]?end|api\s+engineer|server[\s-]?side|node\.?js\s+engineer|python\s+engineer|java\s+engineer|go\s+engineer/i],
  },
  {
    family: 'fullstack',
    patterns: [/full[\s-]?stack|software\s+engineer|software\s+developer/i],
  },
  {
    family: 'qa',
    patterns: [/qa\s+engineer|quality\s+assurance|sdet|test\s+engineer|automation\s+engineer/i],
  },
  {
    family: 'product',
    patterns: [/product\s+manager|program\s+manager|technical\s+program/i],
  },
  {
    family: 'design',
    patterns: [/ui\/ux|ux\s+designer|product\s+designer|design\s+engineer/i],
  },
  {
    family: 'em',
    patterns: [/engineering\s+manager|engineering\s+lead|vp\s+of\s+engineering|director\s+of\s+engineering/i],
  },
]

export function inferRoleFamily(jobTitle: string, jobDescription?: string): string {
  const haystack = `${jobTitle} ${jobDescription?.slice(0, 500) ?? ''}`.toLowerCase()

  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(haystack))) return rule.family
  }

  return 'other'
}
