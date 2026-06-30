'use client'
import { useEffect, useRef, useState } from 'react'
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Importance, Note, Project, Status, Subproject } from '../types'
import { IMPORTANCE_LABELS, IMPORTANCE_ORDER, STATUS_ACCENT, STATUS_LABELS, STATUS_ORDER, dlStatus, toEU } from '../constants'
import SortableSubRow from './SortableSubRow'
import InlineDropdown from './InlineDropdown'

function nextStatus(status: Status): Status {
  const i = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
}

interface ProjectCardProps {
  project: Project
  isSelected?: boolean
  onToggleSelect?: () => void
  onOpenDetail: () => void
  onChangeStatus: (status: Status) => void
  onChangeSubStatus: (sub: Subproject, status: Status) => void
  onReorderSubprojects: (reordered: Subproject[]) => void
  onChangeImportance: (importance: Importance) => void
  onCopyNumber: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onDuplicate: () => void
  onAddSubproject: () => void
  onEditSubproject: (sub: Subproject) => void
  onDeleteSubproject: (sub: Subproject) => void
  onArchiveSubproject: (sub: Subproject) => void
  onDuplicateSubproject: (sub: Subproject) => void
  onAddNote: (subprojectId?: string) => void
  onEditNote: (note: Note, subprojectId?: string) => void
  onDeleteNote: (note: Note, subprojectId?: string) => void
}


export default function ProjectCard({
  project,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onChangeStatus,
  onChangeSubStatus,
  onReorderSubprojects,
  onChangeImportance,
  onCopyNumber,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onAddSubproject,
  onEditSubproject,
  onDeleteSubproject,
  onArchiveSubproject,
  onDuplicateSubproject,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const archiveCalledRef = useRef(false)

  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  function spawnFireworks(originX: number, originY: number) {
    const colors = ['#ef4444', '#dc2626', '#c0392b', '#f97316', '#fb923c', '#fbbf24', '#ff6b6b']
    const count = 55
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      const angle = Math.random() * Math.PI * 2
      const speed = 120 + Math.random() * 380
      const size = 5 + Math.random() * 9
      const color = colors[Math.floor(Math.random() * colors.length)]
      const lifetime = 800 + Math.random() * 700
      const isRect = Math.random() > 0.6
      el.style.cssText = `position:fixed;left:${originX}px;top:${originY}px;width:${size}px;height:${isRect ? size * 0.4 : size}px;border-radius:${isRect ? 2 : 50}%;background:${color};pointer-events:none;z-index:9999;transform:translate(-50%,-50%);will-change:transform,opacity`
      document.body.appendChild(el)
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed
      const gravity = 420
      const start = performance.now()
      const tick = (now: number) => {
        const t = (now - start) / 1000
        const x = originX + vx * t
        const y = originY + vy * t + 0.5 * gravity * t * t
        const progress = (now - start) / lifetime
        const opacity = Math.max(0, 1 - progress * progress)
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.style.opacity = String(opacity)
        if (opacity > 0) requestAnimationFrame(tick)
        else el.remove()
      }
      requestAnimationFrame(tick)
    }
  }

  function handleArchiveClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!project.archived && !archiving) {
      archiveCalledRef.current = false
      const btn = e.currentTarget as HTMLElement
      const rect = btn.getBoundingClientRect()
      spawnFireworks(rect.left + rect.width / 2, rect.top + rect.height / 2)
      setArchiving(true)
    } else {
      onArchive()
    }
  }

  function handleAnimationEnd() {
    if (archiving && !archiveCalledRef.current) {
      archiveCalledRef.current = true
      // Masquer immédiatement via DOM pour éviter le flash de démontage React
      if (cardRef.current) cardRef.current.style.visibility = 'hidden'
      onArchive()
    }
  }

  const subprojects = project.subprojects || []
  const notes = project.notes || []
  const subSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleSubDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = subprojects.findIndex(s => s.id === active.id)
    const newIndex = subprojects.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorderSubprojects(arrayMove(subprojects, oldIndex, newIndex))
  }

  const dls = dlStatus(project.deadline)
  const dlClass = dls === 'over' ? 'dl-over' : dls === 'warn' ? 'dl-warn' : ''

  return (
    <div
      ref={cardRef}
      className={`t-bg-card rounded-lg p-3 cursor-grab active:cursor-grabbing relative overflow-visible${archiving ? ' card-archiving' : ''}`}
      style={{ boxShadow: 'var(--card-shadow)', borderLeft: `3px solid ${STATUS_ACCENT[project.status]}` }}
      onClick={onOpenDetail}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="flex items-center gap-3">
        {onToggleSelect && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect() }}
            className="card-select-btn shrink-0"
            style={{
              width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              background: isSelected ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {isSelected && <i className="ti ti-check" style={{ fontSize: '0.6rem', color: '#fff' }} />}
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); setExpanded(ex => !ex) }} className="t-text-muted shrink-0">
          <i className={`ti ti-chevron-${expanded ? 'down' : 'right'}`} />
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Ligne 1 : numéro + bulles + nom */}
          <div className="flex items-center gap-2 min-w-0 proj-num-row">
            <span className="text-xs t-text-muted shrink-0 whitespace-nowrap" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {project.number}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onCopyNumber() }}
              title="Copier le numéro"
              className="btn-copy-num"
            >
              <i className="ti ti-copy" style={{ fontSize: '0.6rem' }} />
            </button>
            {notes.length > 0 && (
              <span className="notes-bubble" title={`${notes.length} note${notes.length > 1 ? 's' : ''}`}>
                <i className="ti ti-note" style={{ fontSize: '0.6rem' }} /> {notes.length}
              </span>
            )}
            {subprojects.length > 0 && (
              <span className="subs-bubble" title={`${subprojects.length} sous-projet${subprojects.length > 1 ? 's' : ''}`}>
                <i className="ti ti-folders" style={{ fontSize: '0.6rem' }} /> {subprojects.length}
              </span>
            )}
            <span className="text-sm font-semibold truncate">{project.name}</span>
          </div>

          {/* Ligne 2 : statut + barre de progression + métadonnées */}
          <div className="flex items-center gap-2 min-w-0">
            <InlineDropdown<Status>
              value={project.status}
              options={STATUS_ORDER}
              labels={STATUS_LABELS}
              onChange={onChangeStatus}
              triggerClassName={`status-badge s-${project.status} flex items-center`}
              triggerStyle={{ fontSize: '0.62rem', padding: '2px 7px' }}
              renderOption={opt => (
                <span className={`status-badge s-${opt}`} style={{ pointerEvents: 'none' }}>{STATUS_LABELS[opt]}</span>
              )}
            />
            <div className="prog-wrap" style={{ width: 100, flexShrink: 0 }}>
              <div className="prog-bar-bg">
                <div className="prog-fill-bg" style={{ width: `${project.progress ?? 0}%`, background: (project.progress ?? 0) >= 100 ? 'var(--s-done-fg)' : 'var(--accent)' }} />
              </div>
              <span className="prog-pct">{project.progress ?? 0}%</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {project.editor && (
                <span className="tag-chip"><i className="ti ti-building" style={{ fontSize: '0.6rem' }} />{project.editor}</span>
              )}
              {project.client && (
                <span className="tag-chip"><i className="ti ti-user" style={{ fontSize: '0.6rem' }} />{project.client}</span>
              )}
              {project.deadline && (
                <span className={`tag-chip ${dlClass}`}>☠ {toEU(project.deadline)}</span>
              )}
              {project.archived && (
                <span className="tag-chip"><i className="ti ti-archive" style={{ fontSize: '0.6rem' }} />Archivé</span>
              )}
            </div>
          </div>
        </div>

        <InlineDropdown<Importance>
          value={project.importance}
          options={IMPORTANCE_ORDER}
          labels={IMPORTANCE_LABELS}
          onChange={onChangeImportance}
          triggerClassName={`imp-tag imp-tag-${project.importance} flex items-center shrink-0`}
          triggerStyle={{ fontSize: '0.62rem', padding: '2px 7px' }}
          renderOption={opt => (
            <span className={`imp-tag imp-tag-${opt}`} style={{ pointerEvents: 'none' }}>{IMPORTANCE_LABELS[opt]}</span>
          )}
        />
        <button onClick={e => { e.stopPropagation(); onEdit() }} className="sidebar-icon-btn rounded p-1" title="Modifier" style={{ color: 'var(--text-primary)' }}>
          <i className="ti ti-edit" />
        </button>
        <button
          onClick={handleArchiveClick}
          title={project.archived ? 'Désarchiver' : 'Archiver'}
          className="sidebar-icon-btn rounded p-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <i className={`ti ti-archive${project.archived ? '-off' : ''}`} />
        </button>
        <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="sidebar-icon-btn rounded p-1"
            title="Plus d'actions"
            style={{ color: 'var(--text-muted)' }}
          >
            <i className="ti ti-dots" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-30 flex flex-col py-1"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', minWidth: 140 }}
            >
              <button
                onClick={() => { setMenuOpen(false); onDuplicate() }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover-bg)] text-left"
                style={{ color: 'var(--text-secondary)' }}
              >
                <i className="ti ti-copy" style={{ fontSize: '0.85rem' }} /> Dupliquer
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover-bg)] text-left"
                style={{ color: '#ef4444' }}
              >
                <i className="ti ti-trash" style={{ fontSize: '0.85rem' }} /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pl-8 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
          {/* Sous-projets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium t-text-muted uppercase">Sous-projets</span>
              <button onClick={onAddSubproject} className="text-xs" style={{ color: 'var(--accent)' }}>
                + Ajouter
              </button>
            </div>
            {subprojects.length === 0 && <p className="text-xs t-text-muted">Aucun sous-projet.</p>}
            <DndContext sensors={subSensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
              <SortableContext items={subprojects.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {subprojects.map(s => (
                    <SortableSubRow key={s.id} id={s.id}>
                      <div className="flex items-center gap-2 rounded border t-border px-2 py-1.5">
                        <span className="text-xs t-text-muted shrink-0 whitespace-nowrap">{s.number}</span>
                        <span className="flex-1 text-sm truncate">{s.name}</span>
                        <button
                          onClick={() => onChangeSubStatus(s, nextStatus(s.status))}
                          title="Cliquer pour changer le statut"
                          className={`status-badge s-${s.status}`}
                          style={{ fontSize: '0.62rem', padding: '2px 7px', cursor: 'pointer', border: 'none', font: 'inherit' }}
                        >
                          {STATUS_LABELS[s.status]}
                        </button>
                        <span className="text-xs t-text-muted w-9 text-right">{s.progress ?? 0}%</span>
                        <button
                          onClick={() => onArchiveSubproject(s)}
                          title={s.archived ? 'Désarchiver' : 'Archiver'}
                          className="sidebar-icon-btn rounded p-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <i className={`ti ti-archive${s.archived ? '-off' : ''}`} />
                        </button>
                        <button
                          onClick={() => onDuplicateSubproject(s)}
                          title="Dupliquer"
                          className="sidebar-icon-btn rounded p-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <i className="ti ti-copy" />
                        </button>
                        <button onClick={() => onEditSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                          <i className="ti ti-edit" />
                        </button>
                        <button onClick={() => onDeleteSubproject(s)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </SortableSubRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
                  <span className="text-xs t-text-muted shrink-0">{new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
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
