'use client'
import { useEffect, useRef, useState } from 'react'
import { Category, Importance, Status } from '../types'
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
  initialNote: string
}

interface ProjectModalProps {
  project?: { number: string; name: string; cat: Category; year: number; status: Status; progress: number | null; importance: Importance; editor?: string | null; client?: string | null; date?: string | null; deadline?: string | null } | null
  defaultCat: Category
  defaultYear: number
  editors?: string[]
  clients?: string[]
  onSave: (values: ProjectFormValues) => Promise<void>
  onClose: () => void
}

export default function ProjectModal({ project, defaultCat, defaultYear, editors = [], clients = [], onSave, onClose }: ProjectModalProps) {
  const [values, setValues] = useState<ProjectFormValues>({
    number: project?.number ?? `${defaultYear}_`,
    name: project?.name ?? '',
    cat: project?.cat ?? defaultCat,
    year: project?.year ?? defaultYear,
    status: project?.status ?? 'ready',
    progress: project?.progress ?? 0,
    importance: project?.importance ?? 'medium',
    editor: project?.editor ?? '',
    client: project?.client ?? '',
    date: project?.date ?? '',
    deadline: project?.deadline ?? '',
    initialNote: '',
  })
  const [saving, setSaving] = useState(false)
  const numberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!project && numberRef.current) {
      numberRef.current.focus()
      numberRef.current.setSelectionRange(numberRef.current.value.length, numberRef.current.value.length)
    }
  }, [project])

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

  const autoProgress = AUTO_PROGRESS[values.status]
  const progressIsAuto = autoProgress != null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ti ti-layout-grid-add" style={{ fontSize: '18px' }} />
          {project ? 'Modifier le projet' : 'Nouveau projet'}
        </h2>

        <div className="flex flex-col gap-3">
          {/* Numéro + Catégorie */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Numéro</label>
              <input
                ref={numberRef}
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.number}
                onChange={e => setValues(v => ({ ...v, number: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Catégorie</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.cat}
                onChange={e => setValues(v => ({ ...v, cat: e.target.value as Category }))}
              >
                <option value="pro">Pro</option>
                <option value="perso">Perso</option>
              </select>
            </div>
          </div>

          {/* Nom du projet */}
          <div>
            <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Nom du projet</label>
            <input
              autoFocus={!!project}
              className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
              placeholder="Nom du projet"
              value={values.name}
              onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
            />
          </div>

          {/* Éditeur + Client(s) */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Éditeur</label>
              <input
                list="editor-suggest"
                placeholder="Éditeur..."
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.editor}
                onChange={e => setValues(v => ({ ...v, editor: e.target.value }))}
              />
              <datalist id="editor-suggest">
                {editors.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">
                Client(s) <span className="normal-case font-normal opacity-60">virgule = plusieurs</span>
              </label>
              <input
                list="client-suggest"
                placeholder="Client A, Client B..."
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.client}
                onChange={e => setValues(v => ({ ...v, client: e.target.value }))}
              />
              <datalist id="client-suggest">
                {clients.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Date de début</label>
              <input
                type="date"
                lang="fr-FR"
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.date}
                onChange={e => setValues(v => ({ ...v, date: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">✈ Deadline</label>
              <input
                type="date"
                lang="fr-FR"
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.deadline}
                onChange={e => setValues(v => ({ ...v, deadline: e.target.value }))}
              />
            </div>
          </div>

          {/* Statut + Importance */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Statut</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.status}
                onChange={e => onStatusChange(e.target.value as Status)}
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Importance</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1"
                value={values.importance}
                onChange={e => setValues(v => ({ ...v, importance: e.target.value as Importance }))}
              >
                {IMPORTANCE_ORDER.map(i => (
                  <option key={i} value={i}>{IMPORTANCE_LABELS[i]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progression slider */}
          <div>
            <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Progression</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range"
                min={0}
                max={100}
                className="flex-1"
                value={values.progress}
                onChange={e => setValues(v => ({ ...v, progress: parseInt(e.target.value) }))}
              />
              <span className="text-sm font-semibold t-text-muted w-8 text-right">{values.progress}%</span>
            </div>
            {progressIsAuto && (
              <p className="text-xs t-text-muted mt-1">Auto : {autoProgress}% pour "{STATUS_LABELS[values.status]}" — ajustable</p>
            )}
          </div>

          {/* Note initiale (création seulement) */}
          {!project && (
            <div>
              <label className="text-xs font-semibold t-text-muted uppercase tracking-wide">Note initiale</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm t-border mt-1 resize-none"
                rows={3}
                placeholder="Ajouter une note..."
                value={values.initialNote}
                onChange={e => setValues(v => ({ ...v, initialNote: e.target.value }))}
              />
            </div>
          )}
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
            {project ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
