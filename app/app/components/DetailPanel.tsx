'use client'
import { useEffect, useRef, useState } from 'react'
import { Note, Project, Subproject, Status, Importance } from '../types'
import { STATUS_LABELS, IMPORTANCE_LABELS, STATUS_ORDER, IMPORTANCE_ORDER, toEU } from '../constants'

interface DetailPanelProps {
  project: Project
  panelPos?: { top: number; left: number; connectorW: number; connectorTop: number; color: string }
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onArchive: () => void
  onDelete: () => void
  onChangeStatus: (status: Status) => void
  onChangeImportance: (importance: Importance) => void
  onChangeProgress: (progress: number) => void
  onAddSubproject: () => void
  onEditSubproject: (sub: Subproject) => void
  onDeleteSubproject: (sub: Subproject) => void
  onAddNote: (subprojectId?: string) => void
  onEditNote: (note: Note, subprojectId?: string) => void
  onDeleteNote: (note: Note, subprojectId?: string) => void
}

export default function DetailPanel({
  project,
  panelPos,
  onClose,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onChangeStatus,
  onChangeImportance,
  onChangeProgress,
  onAddSubproject,
  onEditSubproject,
  onDeleteSubproject,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [localProgress, setLocalProgress] = useState(project.progress ?? 0)

  useEffect(() => {
    setLocalProgress(project.progress ?? 0)
  }, [project.progress])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  const subprojects = (project.subprojects || []).filter(s => !s.archived)
  const notes = project.notes || []

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex w-[400px] max-w-[90vw] max-h-[calc(100vh-6rem)] flex-col overflow-y-auto rounded-lg t-bg-card p-4"
      style={{
        boxShadow: 'var(--card-shadow)',
        borderLeft: `3px solid ${panelPos?.color || 'var(--accent)'}`,
        top: panelPos ? panelPos.top : '5rem',
        left: panelPos ? panelPos.left : undefined,
        right: panelPos ? undefined : '1.25rem',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={onClose} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
          <i className="ti ti-x" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onArchive}
            title={project.archived ? 'Désarchiver' : 'Archiver'}
            className="sidebar-icon-btn rounded p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <i className={`ti ti-archive${project.archived ? '-off' : ''}`} />
          </button>
          <button onClick={onDuplicate} title="Dupliquer" className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className="ti ti-copy" />
          </button>
          <button onClick={onEdit} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className="ti ti-edit" />
          </button>
          <button onClick={onDelete} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className="ti ti-trash" />
          </button>
        </div>
      </div>

      <span className="text-xs t-text-muted">{project.number}</span>
      <h2 className="text-lg font-semibold mb-3">{project.name}</h2>

      {/* Statut + Importance inline */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={project.status}
          onChange={e => onChangeStatus(e.target.value as Status)}
          className={`status-badge s-${project.status}`}
          style={{ border: 'none', cursor: 'pointer', font: 'inherit', appearance: 'none', WebkitAppearance: 'none', paddingRight: '0.5rem' }}
        >
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={project.importance}
          onChange={e => onChangeImportance(e.target.value as Importance)}
          className={`imp-tag imp-tag-${project.importance}`}
          style={{ border: 'none', cursor: 'pointer', font: 'inherit', appearance: 'none', WebkitAppearance: 'none', paddingRight: '0.5rem' }}
        >
          {IMPORTANCE_ORDER.map(i => (
            <option key={i} value={i}>{IMPORTANCE_LABELS[i]}</option>
          ))}
        </select>
      </div>

      {/* Slider de progression */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={localProgress}
            onChange={e => setLocalProgress(Number(e.target.value))}
            onMouseUp={e => onChangeProgress(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={e => onChangeProgress(Number((e.target as HTMLInputElement).value))}
            className="flex-1"
            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span className="prog-pct" style={{ minWidth: '2.5rem', textAlign: 'right' }}>{localProgress}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs t-text-muted mb-4">
        {project.editor && (
          <span>
            <i className="ti ti-user" /> {project.editor}
          </span>
        )}
        {project.client && (
          <span>
            <i className="ti ti-building" /> {project.client}
          </span>
        )}
        {project.deadline && (
          <span>
            <i className="ti ti-calendar" /> {toEU(project.deadline)}
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium t-text-muted uppercase">
            Sous-projets ({subprojects.length})
          </span>
          <button onClick={onAddSubproject} className="text-xs" style={{ color: 'var(--accent)' }}>
            + Ajouter
          </button>
        </div>
        {subprojects.length === 0 && <p className="text-xs t-text-muted">Aucun sous-projet.</p>}
        <div className="flex flex-col gap-1.5">
          {subprojects.map(s => (
            <div key={s.id} className="flex items-center gap-2 rounded border t-border px-2 py-1.5">
              <span className="text-xs t-text-muted shrink-0">{s.number}</span>
              <span className="flex-1 text-sm truncate">{s.name}</span>
              <span className={`status-badge s-${s.status}`} style={{ fontSize: '0.62rem', padding: '2px 7px' }}>
                {STATUS_LABELS[s.status]}
              </span>
              <button onClick={() => onEditSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-edit" />
              </button>
              <button onClick={() => onDeleteSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium t-text-muted uppercase">Notes</span>
          <button onClick={() => onAddNote()} className="text-xs" style={{ color: 'var(--accent)' }}>
            + Ajouter
          </button>
        </div>
        {notes.length === 0 && <p className="text-xs t-text-muted">Aucune note.</p>}
        <div className="flex flex-col gap-1.5">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 rounded border t-border px-2 py-1.5">
              {n.date && <span className="text-xs t-text-muted shrink-0">{n.date}</span>}
              <span className="flex-1 text-sm">{n.text}</span>
              <button onClick={() => onEditNote(n)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-edit" />
              </button>
              <button onClick={() => onDeleteNote(n)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
