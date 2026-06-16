'use client'
import { Importance, Status } from '../types'
import { STATUS_LABELS, STATUS_ORDER, IMPORTANCE_LABELS, IMPORTANCE_ORDER } from '../constants'

export type SortMode = 'manual' | 'updated' | 'number' | 'name' | 'importance' | 'deadline' | 'progress'

interface FilterBarProps {
  status: Status | ''
  importance: Importance | ''
  editor: string
  sort: SortMode
  editors: string[]
  hasActiveFilters: boolean
  onStatusChange: (v: Status | '') => void
  onImportanceChange: (v: Importance | '') => void
  onEditorChange: (v: string) => void
  onSortChange: (v: SortMode) => void
  onClear: () => void
}

export default function FilterBar({
  status,
  importance,
  editor,
  sort,
  editors,
  hasActiveFilters,
  onStatusChange,
  onImportanceChange,
  onEditorChange,
  onSortChange,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value as Status | '')}
        className="rounded-lg border t-border px-2 py-1.5 text-sm bg-transparent"
      >
        <option value="">Statut</option>
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      <select
        value={importance}
        onChange={e => onImportanceChange(e.target.value as Importance | '')}
        className="rounded-lg border t-border px-2 py-1.5 text-sm bg-transparent"
      >
        <option value="">Importance</option>
        {IMPORTANCE_ORDER.map(i => (
          <option key={i} value={i}>{IMPORTANCE_LABELS[i]}</option>
        ))}
      </select>

      <select
        value={editor}
        onChange={e => onEditorChange(e.target.value)}
        className="rounded-lg border t-border px-2 py-1.5 text-sm bg-transparent"
      >
        <option value="">Éditeur</option>
        {editors.map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <select
        value={sort}
        onChange={e => onSortChange(e.target.value as SortMode)}
        className="rounded-lg border t-border px-2 py-1.5 text-sm bg-transparent ml-auto"
      >
        <option value="manual">Tri manuel</option>
        <option value="updated">Mis à jour</option>
        <option value="number">Numéro</option>
        <option value="name">Nom</option>
        <option value="importance">Importance</option>
        <option value="deadline">Échéance</option>
        <option value="progress">Progression</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          title="Effacer les filtres"
          className="rounded-lg border t-border px-2 py-1.5 text-sm"
          style={{ color: 'var(--s-sent-fg)' }}
        >
          <i className="ti ti-filter-off" />
        </button>
      )}
    </div>
  )
}
