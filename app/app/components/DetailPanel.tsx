'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Note, Project, Subproject, Status, Importance } from '../types'
import { STATUS_LABELS, IMPORTANCE_LABELS, STATUS_ORDER, IMPORTANCE_ORDER, toEU } from '../constants'
import InlineDropdown from './InlineDropdown'

interface DetailPanelProps {
  project: Project
  panelRef: React.RefObject<HTMLDivElement | null>
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
  panelRef,
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
  const [localProgress, setLocalProgress] = useState(project.progress ?? 0)
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const prevNoteIdsRef = useRef<Set<string>>(new Set((project.notes || []).map(n => n.id)))

  useEffect(() => {
    setLocalProgress(project.progress ?? 0)
  }, [project.progress])

  useEffect(() => {
    const prev = prevNoteIdsRef.current
    const current = project.notes || []
    const added = current.find(n => !prev.has(n.id))
    if (added) {
      setNewNoteId(added.id)
      setTimeout(() => setNewNoteId(null), 600)
    }
    prevNoteIdsRef.current = new Set(current.map(n => n.id))
  }, [project.notes])

  const subprojects = (project.subprojects || []).filter(s => !s.archived)
  const notes = [...(project.notes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex w-[400px] max-w-[90vw] max-h-[calc(100vh-6rem)] flex-col overflow-y-auto rounded-lg t-bg-card p-4 detail-panel-enter"
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

      {/* Statut + Importance — dropdowns inline */}
      <div className="flex items-center gap-2 mb-3">
        <InlineDropdown<Status>
          value={project.status}
          options={STATUS_ORDER}
          labels={STATUS_LABELS}
          onChange={onChangeStatus}
          triggerClassName={`status-badge s-${project.status} flex items-center`}
          renderOption={opt => (
            <span className={`status-badge s-${opt}`} style={{ pointerEvents: 'none' }}>{STATUS_LABELS[opt]}</span>
          )}
        />
        <InlineDropdown<Importance>
          value={project.importance}
          options={IMPORTANCE_ORDER}
          labels={IMPORTANCE_LABELS}
          onChange={onChangeImportance}
          triggerClassName={`imp-tag imp-tag-${project.importance} flex items-center`}
          renderOption={opt => (
            <span className={`imp-tag imp-tag-${opt}`} style={{ pointerEvents: 'none' }}>{IMPORTANCE_LABELS[opt]}</span>
          )}
        />
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
        <div className="flex flex-col gap-2">
          {subprojects.map(s => (
            <div key={s.id} className="rounded border t-border overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-xs t-text-muted shrink-0">{s.number}</span>
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <span className={`status-badge s-${s.status}`} style={{ fontSize: '0.62rem', padding: '2px 7px' }}>
                  {STATUS_LABELS[s.status]}
                </span>
                <button onClick={() => onAddNote(s.id)} className="sidebar-icon-btn rounded p-1" title="Ajouter une note" style={{ color: 'var(--accent)' }}>
                  <i className="ti ti-plus" style={{ fontSize: '0.75rem' }} />
                </button>
                <button onClick={() => onEditSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                  <i className="ti ti-edit" />
                </button>
                <button onClick={() => onDeleteSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                  <i className="ti ti-trash" />
                </button>
              </div>
              {(s.notes || []).length > 0 && (
                <div className="border-t t-border">
                  {[...(s.notes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(n => (
                    <div key={n.id} className="flex items-start gap-2 px-2 py-1.5 border-b t-border last:border-b-0" style={{ background: 'var(--hover-bg, rgba(0,0,0,0.02))' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">{n.text}</p>
                        <span className="text-xs t-text-muted">{fmtDate(n.created_at)}</span>
                      </div>
                      <button onClick={() => onEditNote(n, s.id)} className="sidebar-icon-btn rounded p-0.5" style={{ color: 'var(--text-muted)' }}>
                        <i className="ti ti-edit" style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button onClick={() => onDeleteNote(n, s.id)} className="sidebar-icon-btn rounded p-0.5" style={{ color: 'var(--text-muted)' }}>
                        <i className="ti ti-trash" style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <div key={n.id} className={`flex items-start gap-2 rounded border t-border px-2 py-1.5${n.id === newNoteId ? ' note-enter' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{n.text}</p>
                <span className="text-xs t-text-muted">{fmtDate(n.created_at)}</span>
              </div>
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
