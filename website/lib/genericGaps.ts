export type GenericGap = {
  id: string
  label: string
  description: string
  patterns: RegExp[]
}

export const GENERIC_GAPS: GenericGap[] = [
  {
    id: 'cloud',
    label: 'cloud infrastructure',
    description: 'aws, gcp, or azure platform experience',
    patterns: [/\baws\b/i, /\bgcp\b/i, /\bazure\b/i, /cloud/i, /\bec2\b/i, /\bs3\b/i, /lambda/i],
  },
  {
    id: 'devops',
    label: 'devops & ci/cd',
    description: 'pipelines, containers, and orchestration',
    patterns: [/docker/i, /kubernetes/i, /\bk8s\b/i, /ci\/?cd/i, /jenkins/i, /terraform/i, /ansible/i, /devops/i],
  },
  {
    id: 'leadership',
    label: 'leadership',
    description: 'managing or mentoring teams',
    patterns: [/lead/i, /manag/i, /mentor/i, /supervis/i, /director/i, /head of/i, /\bvp\b/i],
  },
  {
    id: 'architecture',
    label: 'system design',
    description: 'distributed systems and architecture',
    patterns: [/architect/i, /system design/i, /distributed/i, /microservic/i, /scalab/i, /high.?availab/i],
  },
  {
    id: 'data',
    label: 'data engineering',
    description: 'pipelines, warehouses, and analytics',
    patterns: [/data pipeline/i, /etl/i, /\bspark\b/i, /\bhadoop\b/i, /airflow/i, /snowflake/i, /databricks/i, /\bbigquery\b/i, /warehouse/i],
  },
  {
    id: 'ml',
    label: 'machine learning',
    description: 'ml models, training, or deployment',
    patterns: [/machine learning/i, /\bml\b/i, /\bai\b/i, /tensorflow/i, /pytorch/i, /llm/i, /neural/i, /model.?training/i],
  },
  {
    id: 'frontend',
    label: 'frontend frameworks',
    description: 'modern js frameworks and ui',
    patterns: [/\breact\b/i, /\bvue\b/i, /\bangular\b/i, /\bnext\b/i, /\bsvelte\b/i, /typescript/i, /tailwind/i, /\bcss\b/i],
  },
  {
    id: 'backend',
    label: 'backend services',
    description: 'apis, services, and server-side logic',
    patterns: [/\bapi\b/i, /rest/i, /graphql/i, /\bgrpc\b/i, /backend/i, /server.?side/i, /microservic/i],
  },
  {
    id: 'database',
    label: 'database expertise',
    description: 'sql or nosql at scale',
    patterns: [/\bsql\b/i, /postgres/i, /mysql/i, /mongo/i, /redis/i, /database/i, /nosql/i, /\bdynamo\b/i],
  },
  {
    id: 'mobile',
    label: 'mobile development',
    description: 'ios, android, or cross-platform',
    patterns: [/\bios\b/i, /android/i, /mobile/i, /react.?native/i, /flutter/i, /swift/i, /kotlin/i],
  },
  {
    id: 'language',
    label: 'specific language',
    description: 'a programming language not in your background',
    patterns: [/\bgo\b/i, /\brust\b/i, /\bjava\b/i, /python/i, /\bc\+\+/i, /\bc#\b/i, /ruby/i, /\bphp\b/i, /scala/i, /elixir/i],
  },
  {
    id: 'years',
    label: 'years of experience',
    description: 'tenure requirement above your current level',
    patterns: [/\d+\+?\s*year/i, /senior/i, /staff/i, /principal/i, /experience/i],
  },
  {
    id: 'education',
    label: 'education',
    description: 'degree, certification, or formal credential',
    patterns: [/degree/i, /bachelor/i, /master/i, /\bphd\b/i, /\bbs\b/i, /\bms\b/i, /certif/i, /education/i],
  },
  {
    id: 'security',
    label: 'security',
    description: 'security practices, audits, or compliance',
    patterns: [/security/i, /\boauth\b/i, /encrypt/i, /compliance/i, /\bsoc\s?2\b/i, /\bgdpr\b/i, /penetration/i],
  },
  {
    id: 'testing',
    label: 'testing & qa',
    description: 'automated tests and quality processes',
    patterns: [/test/i, /\bqa\b/i, /jest/i, /cypress/i, /playwright/i, /\btdd\b/i, /unit test/i],
  },
  {
    id: 'product',
    label: 'product sense',
    description: 'shipping user-facing products',
    patterns: [/product/i, /user.?facing/i, /\bux\b/i, /design.?driven/i, /customer/i],
  },
]

const FALLBACK: GenericGap = {
  id: 'other',
  label: 'domain expertise',
  description: 'specialized knowledge for this role',
  patterns: [],
}

export function mapGapsToGeneric(gaps: string[]): GenericGap[] {
  const matched = new Map<string, GenericGap>()
  let fallbackUsed = false

  for (const gap of gaps) {
    const hit = GENERIC_GAPS.find(g => g.patterns.some(p => p.test(gap)))
    if (hit) {
      matched.set(hit.id, hit)
    } else {
      fallbackUsed = true
    }
  }

  const result = Array.from(matched.values())
  if (fallbackUsed) result.push(FALLBACK)
  return result
}
