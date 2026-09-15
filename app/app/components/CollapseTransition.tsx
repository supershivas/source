'use client'
import { useEffect, useState } from 'react'

export default function CollapseTransition({ show, children }: { show: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(show)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (show) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => { setMounted(false); setClosing(false) }, 150)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!mounted) return null
  return <div className={closing ? 'subs-exit' : 'subs-enter'}>{children}</div>
}
