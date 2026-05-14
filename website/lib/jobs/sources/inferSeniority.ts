type Seniority = 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'exec' | 'unknown'

export function inferSeniority(jobTitle: string): Seniority {
  const t = jobTitle.toLowerCase()

  if (/intern|internship/i.test(t)) return 'intern'
  if (/\bjr\b|junior|entry[\s-]?level|associate/i.test(t)) return 'junior'
  if (/\bstaff\b/i.test(t)) return 'staff'
  if (/principal|distinguished/i.test(t)) return 'principal'
  if (/\bvp\b|vice\s+president|director|head\s+of|cto|cpo|chief/i.test(t)) return 'exec'
  if (/\bsr\b|senior|lead/i.test(t)) return 'senior'
  if (/\b(i{2,3}|ii|iii)\b/i.test(t)) return 'mid'

  return 'unknown'
}
