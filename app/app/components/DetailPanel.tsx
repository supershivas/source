'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Note, Project, Subproject, Status, Importance } from '../types'
import { STATUS_LABELS, STATUS_ACCENT, IMPORTANCE_LABELS, STATUS_ORDER, IMPORTANCE_ORDER, toEU } from '../constants'
import InlineDropdown from './InlineDropdown'
import DateInput from './DateInput'

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
  onUpdateField: (patch: Partial<Project>) => void
  onAddSubproject: () => void
  onEditSubproject: (sub: Subproject) => void
  onDeleteSubproject: (sub: Subproject) => void
  onAddNote: (subprojectId?: string) => void
  onEditNote: (note: Note, subprojectId?: string) => void
  onDeleteNote: (note: Note, subprojectId?: string) => void
}

type EditableField = 'name' | 'number' | 'editor' | 'client' | 'date' | 'deadline' | 'ended'

function isStatusNote(text: string) { return text.startsWith('→ ') }

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
  onChangeProgress: _onChangeProgress,
  onUpdateField,
  onAddSubproject,
  onEditSubproject,
  onDeleteSubproject,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: DetailPanelProps) {
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const prevNoteIdsRef = useRef<Set<string>>(new Set((project.notes || []).map(n => n.id)))
  const [editing, setEditing] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [noteTab, setNoteTab] = useState<'all' | 'notes' | 'history'>('all')

  useEffect(() => {
    const prev = prevNoteIdsRef.current
    const current = project.notes || []
    const added = current.find(n => !prev.has(n.id))
    if (added) { setNewNoteId(added.id); setTimeout(() => setNewNoteId(null), 600) }
    prevNoteIdsRef.current = new Set(current.map(n => n.id))
  }, [project.notes])

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  // Commit toute édition en cours lors de la fermeture du panneau
  const commitEditRef = useRef(commitEdit)
  commitEditRef.current = commitEdit
  useEffect(() => () => { commitEditRef.current() }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  function startEdit(field: EditableField) {
    setDraft((project[field] as string | null | undefined) || '')
    setEditing(field)
  }

  function commitEdit() {
    if (!editing) return
    const trimmed = draft.trim()
    const current = (project[editing] as string | null | undefined) || ''
    if (trimmed !== current) onUpdateField({ [editing]: trimmed || null })
    setEditing(null)
  }

  function cancelEdit() { setEditing(null) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { e.nativeEvent.stopPropagation(); cancelEdit() }
  }

  const subprojects = (project.subprojects || []).filter(s => !s.archived)
  const allNotes = [...(project.notes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const visibleNotes = noteTab === 'all' ? allNotes : noteTab === 'notes' ? allNotes.filter(n => !isStatusNote(n.text)) : allNotes.filter(n => isStatusNote(n.text))

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // Finds the status from a status-note text (e.g. "→ Ongoing" → 'ongoing')
  function statusFromNote(text: string): Status | null {
    const label = text.slice(2).trim()
    const entry = Object.entries(STATUS_LABELS).find(([, l]) => l === label)
    return entry ? (entry[0] as Status) : null
  }

  function InlineText({ field, placeholder, className = '', large = false }: { field: EditableField; placeholder: string; className?: string; large?: boolean }) {
    const val = (project[field] as string | null | undefined) || ''
    if (editing === field) {
      return (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={onKeyDown}
          className={`inline-edit-input ${className} ${large ? 'text-lg font-semibold' : 'text-sm'}`}
          style={{ width: '100%' }}
        />
      )
    }
    return (
      <span
        onClick={() => startEdit(field)}
        className={`inline-edit-display ${className} ${large ? 'text-lg font-semibold' : 'text-sm'}`}
        title="Cliquer pour modifier"
      >
        {val || <span className="t-text-muted italic text-sm font-normal">{placeholder}</span>}
      </span>
    )
  }

  function InlineDate({ field, placeholder }: { field: 'date' | 'deadline' | 'ended'; placeholder: string }) {
    const val = (project[field] as string | null | undefined) || ''
    if (editing === field) {
      return (
        <DateInput
          value={val}
          onChange={v => { onUpdateField({ [field]: v || null }); setEditing(null) }}
          className="inline-edit-input text-xs"
        />
      )
    }
    return (
      <span onClick={() => setEditing(field)} className="inline-edit-display text-xs cursor-pointer" title="Cliquer pour modifier">
        {val ? toEU(val) : <span className="italic">{placeholder}</span>}
      </span>
    )
  }

  return (
    <div
      ref={panelRef}
      data-detail-panel
      className="fixed z-40 flex w-[420px] max-w-[90vw] max-h-[calc(100vh-6rem)] flex-col overflow-y-auto rounded-lg t-bg-card p-4 detail-panel-enter"
      style={{
        boxShadow: 'var(--card-shadow)',
        borderLeft: `3px solid ${panelPos?.color || 'var(--accent)'}`,
        top: panelPos ? panelPos.top : '5rem',
        left: panelPos ? panelPos.left : undefined,
        right: panelPos ? undefined : '1.25rem',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
          <i className="ti ti-x" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onArchive} title={project.archived ? 'Désarchiver' : 'Archiver'} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className={`ti ti-archive${project.archived ? '-off' : ''}`} />
          </button>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="sidebar-icon-btn rounded p-1" title="Plus d'actions" style={{ color: 'var(--text-muted)' }}>
              <i className="ti ti-dots" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-30 flex flex-col py-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', minWidth: 160 }}>
                <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover-bg)] text-left" style={{ color: 'var(--text-secondary)' }}>
                  <i className="ti ti-edit" style={{ fontSize: '0.85rem' }} /> Ouvrir le formulaire
                </button>
                <button onClick={() => { setMenuOpen(false); onDuplicate() }} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover-bg)] text-left" style={{ color: 'var(--text-secondary)' }}>
                  <i className="ti ti-copy" style={{ fontSize: '0.85rem' }} /> Dupliquer
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />
                <button onClick={() => { setMenuOpen(false); onDelete() }} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover-bg)] text-left" style={{ color: '#ef4444' }}>
                  <i className="ti ti-trash" style={{ fontSize: '0.85rem' }} /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Numéro + Nom */}
      <div className="mb-1">
        {InlineText({ field: 'number', placeholder: 'Numéro', className: 't-text-muted font-mono text-xs block mb-1' })}
      </div>
      <div className="mb-3">
        {InlineText({ field: 'name', placeholder: 'Nom du projet', large: true })}
      </div>

      {/* Statut + Importance */}
      <div className="flex items-center gap-2 mb-4">
        <InlineDropdown<Status>
          value={project.status}
          options={STATUS_ORDER}
          labels={STATUS_LABELS}
          onChange={onChangeStatus}
          triggerClassName={`status-badge s-${project.status} flex items-center`}
          renderOption={opt => <span className={`status-badge s-${opt}`} style={{ pointerEvents: 'none' }}>{STATUS_LABELS[opt]}</span>}
        />
        <InlineDropdown<Importance>
          value={project.importance}
          options={IMPORTANCE_ORDER}
          labels={IMPORTANCE_LABELS}
          onChange={onChangeImportance}
          triggerClassName={`imp-tag imp-tag-${project.importance} flex items-center`}
          renderOption={opt => <span className={`imp-tag imp-tag-${opt}`} style={{ pointerEvents: 'none' }}>{IMPORTANCE_LABELS[opt]}</span>}
        />
      </div>

      {/* Champs éditables */}
      <div className="mb-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="t-text-muted shrink-0" style={{ width: 72, fontSize: '0.72rem' }}>Éditeur</span>
          {InlineText({ field: 'editor', placeholder: '—' })}
        </div>
        <div className="flex items-center gap-2">
          <span className="t-text-muted shrink-0" style={{ width: 72, fontSize: '0.72rem' }}>Client</span>
          {InlineText({ field: 'client', placeholder: '—' })}
        </div>
      </div>

      {/* Timeline — toujours 3 points fixes, cliquables */}
      {(() => {
        const pts = [
          { field: 'date' as const,     label: 'Début',    color: '#16a34a', pos: 0 },
          { field: 'deadline' as const, label: 'Deadline', color: '#dc2626', pos: 50 },
          { field: 'ended' as const,    label: 'Fin',      color: '#6366f1', pos: 100 },
        ]
        // today position: based on date + deadline if available
        const d0 = project.date ? new Date(project.date).getTime() : null
        const d1 = project.deadline ? new Date(project.deadline).getTime() : null
        const d2 = project.ended ? new Date(project.ended).getTime() : null
        const knownTs = [d0, d1, d2].filter(Boolean) as number[]
        const minTs = knownTs.length ? Math.min(...knownTs) : null
        const maxTs = knownTs.length > 1 ? Math.max(...knownTs) : null
        const todayTs = new Date().getTime()
        const todayPct = (minTs && maxTs && maxTs > minTs)
          ? Math.max(2, Math.min(98, ((todayTs - minTs) / (maxTs - minTs)) * 100))
          : null

        function fmtShort(iso: string) {
          const d = new Date(iso)
          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
        }

        return (
          <div className="mb-4" style={{ paddingBottom: 40 }}>
            <div style={{ position: 'relative', height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 8px' }}>
              {/* fill bar start→today */}
              {todayPct && d0 && (
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${todayPct / 2}%`, background: 'linear-gradient(90deg,#16a34a,#dc2626)', borderRadius: 2, opacity: 0.7 }} />
              )}

              {/* 3 fixed dots */}
              {pts.map(pt => {
                const iso = pt.field === 'date' ? project.date : pt.field === 'deadline' ? project.deadline : project.ended
                const empty = !iso
                return (
                  <div key={pt.field} style={{ position: 'absolute', top: '50%', left: `${pt.pos}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer' }} onClick={() => setEditing(pt.field)}>
                    <div style={{
                      width: 11, height: 11, borderRadius: '50%',
                      background: empty ? 'var(--border)' : pt.color,
                      border: `2px solid var(--card-bg)`,
                      boxShadow: `0 0 0 1.5px ${empty ? 'var(--border)' : pt.color}`,
                      transition: 'background 0.15s',
                    }} />
                    <div style={{
                      position: 'absolute', top: 13, left: 0,
                      transform: pt.pos === 0 ? 'translateX(-8%)' : pt.pos === 100 ? 'translateX(-82%)' : 'translateX(-42%)',
                      fontSize: '0.6rem', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.35,
                    }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)' }}>{pt.label}</span>
                      {editing === pt.field ? (
                        <DateInput
                          value={iso || ''}
                          onChange={v => { onUpdateField({ [pt.field]: v || null }); setEditing(null) }}
                          className="inline-edit-input text-xs"
                        />
                      ) : (
                        <span style={{ display: 'block', fontWeight: iso ? 700 : 400, color: iso ? pt.color : 'var(--text-muted)', fontStyle: iso ? 'normal' : 'italic' }}>
                          {iso ? fmtShort(iso) : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* today marker */}
              {todayPct && (
                <div style={{ position: 'absolute', top: '50%', left: `${todayPct / 2}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                  <div style={{ width: 1.5, height: 22, background: 'var(--text-muted)', position: 'absolute', top: '50%', left: 0, transform: 'translate(-50%,-50%)' }} />
                  <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>auj.</div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

      {/* Sous-projets */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold t-text-muted uppercase tracking-wide">Sous-projets ({subprojects.length})</span>
          <button onClick={onAddSubproject} className="text-xs" style={{ color: 'var(--accent)' }}>+ Ajouter</button>
        </div>
        {subprojects.length === 0 && <p className="text-xs t-text-muted">Aucun sous-projet.</p>}
        <div className="flex flex-col gap-2">
          {subprojects.map(s => (
            <div key={s.id} className="rounded border t-border overflow-hidden">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-xs t-text-muted shrink-0">{s.number}</span>
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <span className={`status-badge s-${s.status}`} style={{ fontSize: '0.62rem', padding: '2px 7px' }}>{STATUS_LABELS[s.status]}</span>
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

      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

      {/* Notes + historique statuts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold t-text-muted uppercase tracking-wide">Notes & historique</span>
          <button onClick={() => onAddNote()} className="text-xs" style={{ color: 'var(--accent)' }}>+ Note</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(['all', 'notes', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setNoteTab(tab)}
              style={{
                fontSize: '0.68rem', padding: '3px 10px', borderRadius: 6,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: noteTab === tab ? 'var(--text-primary)' : 'transparent',
                color: noteTab === tab ? 'var(--card-bg)' : 'var(--text-muted)',
              }}
            >
              {tab === 'all' ? 'Tout' : tab === 'notes' ? 'Notes' : 'Historique'}
            </button>
          ))}
        </div>

        {visibleNotes.length === 0 && <p className="text-xs t-text-muted">Aucune entrée.</p>}
        <div className="flex flex-col gap-1.5">
          {visibleNotes.map(n => {
            if (isStatusNote(n.text)) {
              const s = statusFromNote(n.text)
              const color = s ? STATUS_ACCENT[s] : 'var(--text-muted)'
              return (
                <div key={n.id} className="flex items-center gap-2 rounded px-2 py-1.5" style={{ border: '1px solid var(--border)', background: 'var(--hover-bg, rgba(0,0,0,0.015))' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                  <span className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Statut → <strong>{n.text.slice(2)}</strong>
                  </span>
                  <span className="text-xs t-text-muted shrink-0">{fmtDate(n.created_at)}</span>
                  <button onClick={() => onDeleteNote(n)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                    <i className="ti ti-x" style={{ fontSize: '0.7rem' }} />
                  </button>
                </div>
              )
            }
            return (
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
