import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: requests, error } = await supabaseAdmin
    .from('beta_requests')
    .select('name, email, role, linkedin_url, use_case, frequency, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Digest query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: 'no new requests' })
  }

  const rows = requests.map((r, i) => `
    <tr style="border-top:1px solid #e7e5e4">
      <td style="padding:10px 8px;font-size:13px;color:#1c1917">${i + 1}</td>
      <td style="padding:10px 8px;font-size:13px;color:#1c1917"><strong>${r.name}</strong><br/><span style="color:#78716c;font-size:11px">${r.email}</span></td>
      <td style="padding:10px 8px;font-size:13px;color:#57534e">${r.role}</td>
      <td style="padding:10px 8px;font-size:13px;color:#57534e">${r.frequency}</td>
      <td style="padding:10px 8px;font-size:12px;color:#57534e;max-width:220px">${r.use_case}</td>
      ${r.linkedin_url ? `<td style="padding:10px 8px;font-size:11px"><a href="${r.linkedin_url}" style="color:#c01414">linkedin</a></td>` : '<td style="padding:10px 8px;color:#a8a29e;font-size:11px">—</td>'}
    </tr>
  `).join('')

  await resend.emails.send({
    from: 'JobFit <noreply@jobfit.ai>',
    to: 'ajith98adithya@gmail.com',
    subject: `JobFit beta: ${requests.length} new request${requests.length !== 1 ? 's' : ''} today`,
    html: `
      <div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:32px 24px;color:#1c1917">
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;margin-bottom:16px">
          jobfit · daily beta digest · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 style="font-size:24px;margin:0 0 8px">${requests.length} new beta request${requests.length !== 1 ? 's' : ''} in the last 24 hours</h1>
        <p style="font-size:14px;color:#78716c;margin:0 0 24px">Received since ${new Date(since).toLocaleString()}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e7e5e4">
          <thead>
            <tr style="background:#f5f5f4">
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">#</th>
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">Person</th>
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">Role</th>
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">Frequency</th>
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">Use case</th>
              <th style="padding:8px;text-align:left;font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em">LinkedIn</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, sent: true, count: requests.length })
}
