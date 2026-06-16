'use client'
import { useEffect } from 'react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({ title, message, confirmLabel = 'Supprimer', onConfirm, onClose }: ConfirmModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-2">{title}</h2>
        <p className="text-sm t-text-muted mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-primary">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
