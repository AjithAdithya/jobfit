'use client'
import { useState } from 'react'
import BetaSignupModal from './BetaSignupModal'

interface Props {
  className?: string
  children: React.ReactNode
}

export default function BetaButton({ className, children }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <BetaSignupModal onClose={() => setOpen(false)} />}
    </>
  )
}
