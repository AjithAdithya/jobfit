import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VaultClient from '@/components/VaultClient'

export default async function VaultPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: uploaded }, { data: generated }] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, file_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('analysis_history')
      .select('id, job_title, company_name, score, created_at')
      .eq('user_id', user.id)
      .not('generated_resume', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-10">
        <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 02 — vault</p>
        <h1 className="font-chunk text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-tightest text-ink-900">
          resume vault
        </h1>
        <p className="mt-3 text-[15px] text-ink-500 italic font-serif">
          your source of truth — uploaded PDFs and every tailored resume you've generated.
        </p>
      </div>

      <VaultClient
        uploaded={uploaded ?? []}
        generated={(generated ?? []).map(r => ({
          id: r.id,
          job_title: r.job_title,
          company_name: r.company_name,
          score: r.score ?? 0,
          created_at: r.created_at,
        }))}
      />
    </div>
  )
}
