import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobFit AI — AI-Powered Resume Tailoring',
  description: 'Analyze job descriptions, identify gaps, and generate tailored resumes in seconds. Your data stays yours — bring your own API keys.',
  metadataBase: new URL('https://jobfit.vercel.app'),
  openGraph: {
    title: 'JobFit AI',
    description: 'AI-powered resume tailoring for serious job seekers.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
