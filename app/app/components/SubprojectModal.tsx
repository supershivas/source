'use client'
import { useEffect, useState } from 'react'
import { Status } from '../types'
import { STATUS_LABELS, STATUS_ORDER, AUTO_PROGRESS } from '../constants'

export interface SubprojectFormValues {
  number: string
  name: string
  status: Status
  progress: number
  deadline: string
}

interface SubprojectModalProps {
  initial?: SubprojectFormValues
  parentNumber: string
  onSave: (values: SubprojectFormValues) => Promise<void>
  onClose: () => void
}

export default function SubprojectModal({ initial, parentNumber, onSave, onClose }: SubprojectModalProps) {
  const [values, setValues] = useState<SubprojectFormValues>(
    initial || { number: '', name: '', status: 'ready', progress: 0, deadline: '' }
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function onStatusChange(status: Status) {
    const auto = AUTO_PROGRESS[status]
    setValues(v => ({ ...v, status, progress: auto ?? v.progress }))
  }

  async function handleSubmit() {
    if (!values.name.trim() || saving) return
    setSaving(true)
    await onSave(values)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">{initial ? 'Modifier le sous-projet' : 'Nouveau sous-projet'}</h2>
        <p className="text-xs t-text-muted mb-4">Projet {parentNumber}</p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs t-text-muted">Numéro</label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.number}
                onChange={e => setValues(v => ({ ...v, number: e.target.value }))}
              />
            </div>
            <div className="flex-[2]">
              <label className="text-xs t-text-muted">Nom</label>
              <input
                autoFocus
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.name}
                onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs t-text-muted">Statut</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm t-border"
              value={values.status}
              onChange={e => onStatusChange(e.target.value as Status)}
            >
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs t-text-muted">Progression (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.progress}
                onChange={e => setValues(v => ({ ...v, progress: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs t-text-muted">Échéance</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.deadline}
                onChange={e => setValues(v => ({ ...v, deadline: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !values.name.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {initial ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
