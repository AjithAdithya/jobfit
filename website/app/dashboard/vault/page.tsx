import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VaultClient from '@/components/VaultClient'

export default async function VaultPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: uploaded } = await supabase
    .from('resumes')
    .select('id, file_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-10">
        <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 02 — vault</p>
        <h1 className="font-chunk text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-tightest text-ink-900">
          resume vault
        </h1>
        <p className="mt-3 text-[15px] text-ink-500 italic font-serif">
          your uploaded PDFs — the source of truth for every tailored resume.
        </p>
      </div>

      <VaultClient uploaded={uploaded ?? []} />
    </div>
  )
}
