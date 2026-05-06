import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobFit — tailor resumes that fit the job',
  description: 'A quiet Chrome extension that analyzes any job posting, scores your alignment across ten levels, and generates a tailored resume. Your keys, your data.',
  metadataBase: new URL('https://jobfit.vercel.app'),
  openGraph: {
    title: 'JobFit',
    description: 'Tailor resumes that fit the job.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink-900 antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
