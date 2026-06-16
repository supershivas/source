'use client'
import { useEffect, useState } from 'react'
import { Category, Importance, Project, Status } from '../types'
import { STATUS_LABELS, STATUS_ORDER, IMPORTANCE_LABELS, IMPORTANCE_ORDER, AUTO_PROGRESS } from '../constants'

export interface ProjectFormValues {
  number: string
  name: string
  cat: Category
  year: number
  status: Status
  progress: number
  importance: Importance
  editor: string
  client: string
  date: string
  deadline: string
}

interface ProjectModalProps {
  project?: Project | null
  defaultCat: Category
  defaultYear: number
  onSave: (values: ProjectFormValues) => Promise<void>
  onClose: () => void
}

export default function ProjectModal({ project, defaultCat, defaultYear, onSave, onClose }: ProjectModalProps) {
  const [values, setValues] = useState<ProjectFormValues>({
    number: project?.number || '',
    name: project?.name || '',
    cat: project?.cat || defaultCat,
    year: project?.year || defaultYear,
    status: project?.status || 'ready',
    progress: project?.progress ?? 0,
    importance: project?.importance || 'medium',
    editor: project?.editor || '',
    client: project?.client || '',
    date: project?.date || '',
    deadline: project?.deadline || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
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
        <h2 className="text-lg font-semibold mb-4">{project ? 'Modifier le projet' : 'Nouveau projet'}</h2>

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

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs t-text-muted">Catégorie</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.cat}
                onChange={e => setValues(v => ({ ...v, cat: e.target.value as Category }))}
              >
                <option value="pro">Pro</option>
                <option value="perso">Perso</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs t-text-muted">Année</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.year}
                onChange={e => setValues(v => ({ ...v, year: parseInt(e.target.value) || v.year }))}
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
              <label className="text-xs t-text-muted">Importance</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.importance}
                onChange={e => setValues(v => ({ ...v, importance: e.target.value as Importance }))}
              >
                {IMPORTANCE_ORDER.map(i => (
                  <option key={i} value={i}>{IMPORTANCE_LABELS[i]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs t-text-muted">Éditeur</label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.editor}
                onChange={e => setValues(v => ({ ...v, editor: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs t-text-muted">Client</label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.client}
                onChange={e => setValues(v => ({ ...v, client: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs t-text-muted">Date de début</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2 text-sm t-border"
                value={values.date}
                onChange={e => setValues(v => ({ ...v, date: e.target.value }))}
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
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm t-border">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !values.name.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
          >
            {project ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
