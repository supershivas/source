'use client'
import { useEffect, useState } from 'react'

export interface NoteFormValues {
  text: string
}

interface NoteModalProps {
  initial?: NoteFormValues
  onSave: (values: NoteFormValues) => Promise<void>
  onClose: () => void
}

export default function NoteModal({ initial, onSave, onClose }: NoteModalProps) {
  const [text, setText] = useState(initial?.text || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleSubmit() {
    if (!text.trim() || saving) return
    setSaving(true)
    await onSave({ text })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Modifier la note' : 'Nouvelle note'}</h2>
        <textarea
          autoFocus
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm t-border"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() }
          }}
        />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !text.trim()} className="btn-primary disabled:opacity-50">
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
