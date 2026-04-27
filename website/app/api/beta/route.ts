import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const body = await req.json()
    const { name, email, role, linkedin_url, use_case, frequency } = body

    if (!name || !email || !role || !use_case || !frequency) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const { error: dbError } = await supabase
      .from('beta_requests')
      .insert({ name, email, role, linkedin_url: linkedin_url || null, use_case, frequency })

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the list.' }, { status: 409 })
      }
      throw dbError
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'JobFit <noreply@jobfit.ai>',
        to: email,
        subject: "You're on the JobFit beta list",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;margin-bottom:24px">jobfit ai · beta access</div>
            <h1 style="font-size:28px;margin:0 0 16px;font-weight:700">You're on the list, ${name.split(' ')[0]}.</h1>
            <p style="font-size:16px;line-height:1.6;color:#57534e;margin:0 0 16px">
              We've received your request for beta access. We'll reach out to <strong>${email}</strong> if and when a spot opens up.
            </p>
            <p style="font-size:16px;line-height:1.6;color:#57534e;margin:0 0 24px">
              In the meantime, no spam — just a yes or no when the beta opens.
            </p>
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
            <p style="font-size:12px;color:#a8a29e">
              You're receiving this because you signed up at jobfit.ai. No further emails until we have news.
            </p>
          </div>
        `,
      }).catch(err => console.warn('Confirmation email failed:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Beta signup error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
