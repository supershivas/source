'use client'
import { useEffect, useState } from 'react'

export interface NoteFormValues {
  text: string
  date: string
}

interface NoteModalProps {
  initial?: NoteFormValues
  onSave: (values: NoteFormValues) => Promise<void>
  onClose: () => void
}

export default function NoteModal({ initial, onSave, onClose }: NoteModalProps) {
  const [values, setValues] = useState<NoteFormValues>(initial || { text: '', date: '' })
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
    if (!values.text.trim() || saving) return
    setSaving(true)
    await onSave(values)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Modifier la note' : 'Nouvelle note'}</h2>

        <div className="flex flex-col gap-3">
          <textarea
            autoFocus
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm t-border"
            value={values.text}
            onChange={e => setValues(v => ({ ...v, text: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div>
            <label className="text-xs t-text-muted">Date (optionnelle)</label>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 text-sm t-border"
              value={values.date}
              onChange={e => setValues(v => ({ ...v, date: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !values.text.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
