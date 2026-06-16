'use client'
import { useState } from 'react'
import { Note, Project, Subproject } from '../types'
import { STATUS_LABELS } from '../constants'

interface ProjectCardProps {
  project: Project
  onEdit: () => void
  onDelete: () => void
  onAddSubproject: () => void
  onEditSubproject: (sub: Subproject) => void
  onDeleteSubproject: (sub: Subproject) => void
  onAddNote: (subprojectId?: string) => void
  onEditNote: (note: Note, subprojectId?: string) => void
  onDeleteNote: (note: Note, subprojectId?: string) => void
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onAddSubproject,
  onEditSubproject,
  onDeleteSubproject,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const subprojects = project.subprojects || []
  const notes = project.notes || []

  return (
    <div className="t-bg-card rounded-lg p-3" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex items-center gap-3">
        <button onClick={() => setExpanded(e => !e)} className="t-text-muted shrink-0">
          <i className={`ti ti-chevron-${expanded ? 'down' : 'right'}`} />
        </button>
        <span className="text-xs t-text-muted w-10 shrink-0">{project.number}</span>
        <span className="flex-1 text-sm font-medium truncate">{project.name}</span>
        {subprojects.length > 0 && (
          <span className="text-xs t-text-muted">
            <i className="ti ti-folders" /> {subprojects.length}
          </span>
        )}
        <span className={`status-badge s-${project.status}`}>{STATUS_LABELS[project.status]}</span>
        <div className="prog-wrap" style={{ width: 100 }}>
          <div className="prog-bar-bg">
            <div className="prog-fill-bg" style={{ width: `${project.progress ?? 0}%`, background: 'var(--accent)' }} />
          </div>
          <span className="prog-pct">{project.progress ?? 0}%</span>
        </div>
        <button onClick={onEdit} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
          <i className="ti ti-edit" />
        </button>
        <button onClick={onDelete} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
          <i className="ti ti-trash" />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pl-8 flex flex-col gap-3">
          {/* Sous-projets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium t-text-muted uppercase">Sous-projets</span>
              <button onClick={onAddSubproject} className="text-xs" style={{ color: 'var(--accent)' }}>
                + Ajouter
              </button>
            </div>
            {subprojects.length === 0 && <p className="text-xs t-text-muted">Aucun sous-projet.</p>}
            <div className="flex flex-col gap-1.5">
              {subprojects.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded border t-border px-2 py-1.5">
                  <span className="text-xs t-text-muted w-10 shrink-0">{s.number}</span>
                  <span className="flex-1 text-sm truncate">{s.name}</span>
                  <span className={`status-badge s-${s.status}`} style={{ fontSize: '0.62rem', padding: '2px 7px' }}>
                    {STATUS_LABELS[s.status]}
                  </span>
                  <span className="text-xs t-text-muted w-9 text-right">{s.progress ?? 0}%</span>
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

          {/* Notes */}
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
      )}
    </div>
  )
}
