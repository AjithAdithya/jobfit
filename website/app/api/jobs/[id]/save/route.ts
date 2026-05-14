import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return toggleField(params.id, 'saved', true)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return toggleField(params.id, 'saved', false)
}

async function toggleField(jobId: string, field: 'saved' | 'hidden', value: boolean) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('job_scores')
      .update({ [field]: value })
      .eq('job_id', jobId)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
