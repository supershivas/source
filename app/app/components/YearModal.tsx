'use client'
import { useEffect, useState } from 'react'

interface YearModalProps {
  onConfirm: (year: number) => void
  onClose: () => void
}

export default function YearModal({ onConfirm, onClose }: YearModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    const year = parseInt(value, 10)
    if (!value.trim() || isNaN(year) || year < 2000 || year > 2100) {
      setError('Année invalide (2000–2100)')
      return
    }
    onConfirm(year)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') handleConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-3">Nouvelle année</h2>
        <input
          autoFocus
          type="number"
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="2027"
          className="w-full rounded-lg border px-3 py-2 text-sm t-border"
        />
        {error && <p className="text-xs mt-1" style={{ color: 'var(--s-sent-fg)' }}>{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm t-border">
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
