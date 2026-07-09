'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Note, Status, Subproject } from '../types'
import { STATUS_LABELS, STATUS_ACCENT, STATUS_ORDER, toEU } from '../constants'
import InlineDropdown from './InlineDropdown'
import DateInput from './DateInput'

interface SubprojectDetailPanelProps {
  sub: Subproject
  parentName: string
  panelRef: React.RefObject<HTMLDivElement | null>
  panelPos?: { top: number; left: number; connectorW: number; connectorTop: number; color: string }
  mobile?: boolean
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onChangeStatus: (status: Status) => void
  onUpdateField: (patch: Partial<Subproject>) => void
  onQuickAddNote: (text: string) => Promise<void>
  onEditNote: (note: Note) => void
  onDeleteNote: (note: Note) => void
}

type EditableField = 'name' | 'number' | 'deadline' | 'ended'

function isStatusNote(text: string) { return text.startsWith('→ ') }

export default function SubprojectDetailPanel({
  sub,
  parentName,
  panelRef,
  panelPos,
  mobile,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onChangeStatus,
  onUpdateField,
  onQuickAddNote,
  onEditNote,
  onDeleteNote,
}: SubprojectDetailPanelProps) {
  const [editing, setEditing] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [quickNote, setQuickNote] = useState('')
  const quickNoteSubmittingRef = useRef(false)
  const quickNoteRef = useRef<HTMLTextAreaElement>(null)
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const prevNoteIdsRef = useRef<Set<string>>(new Set((sub.notes || []).map(n => n.id)))
  const [noteTab, setNoteTab] = useState<'all' | 'notes' | 'history'>('all')
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    const prev = prevNoteIdsRef.current
    const current = sub.notes || []
    const added = current.find(n => !prev.has(n.id))
    if (added) { setNewNoteId(added.id); setTimeout(() => setNewNoteId(null), 600) }
    prevNoteIdsRef.current = new Set(current.map(n => n.id))
  }, [sub.notes])

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

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
    setDraft((sub[field] as string | null | undefined) || '')
    setEditing(field)
  }

  function commitEdit() {
    if (!editing || editing === 'deadline' || editing === 'ended') return
    const trimmed = draft.trim()
    const current = (sub[editing] as string | null | undefined) || ''
    if (trimmed !== current) onUpdateField({ [editing]: trimmed || null })
    setEditing(null)
  }

  function cancelEdit() { setEditing(null) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { e.nativeEvent.stopPropagation(); cancelEdit() }
  }

  function InlineText({ field, placeholder, className = '', large = false }: { field: 'name' | 'number'; placeholder: string; className?: string; large?: boolean }) {
    const val = (sub[field] as string) || ''
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

  function InlineDateField({ field, placeholder }: { field: 'deadline' | 'ended'; placeholder: string }) {
    const val = (sub[field] as string | null | undefined) || ''
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

  const allNotes = [...(sub.notes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const filteredNotes = noteTab === 'all' ? allNotes : noteTab === 'notes' ? allNotes.filter(n => !isStatusNote(n.text)) : allNotes.filter(n => isStatusNote(n.text))
  const visibleNotes = filteredNotes.slice(0, visibleCount)
  const hiddenCount = filteredNotes.length - visibleNotes.length

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function statusFromNote(text: string): Status | null {
    const label = text.slice(2).trim()
    const entry = Object.entries(STATUS_LABELS).find(([, l]) => l === label)
    return entry ? (entry[0] as Status) : null
  }

  return (
    <div
      ref={panelRef}
      data-detail-panel
      className={mobile
        ? 'fixed inset-0 z-50 flex flex-col overflow-y-auto t-bg-card p-4 detail-panel-enter'
        : 'fixed z-40 flex w-[420px] max-w-[90vw] max-h-[calc(100vh-6rem)] flex-col overflow-y-auto rounded-lg t-bg-card p-4 detail-panel-enter'
      }
      style={mobile ? {
        boxShadow: 'var(--card-shadow)',
        borderTop: `3px solid ${panelPos?.color || STATUS_ACCENT[sub.status] || 'var(--accent)'}`,
      } : {
        boxShadow: 'var(--card-shadow)',
        borderLeft: `3px solid ${panelPos?.color || STATUS_ACCENT[sub.status] || 'var(--accent)'}`,
        top: panelPos ? panelPos.top : '5rem',
        left: panelPos ? panelPos.left : undefined,
        right: panelPos ? undefined : '1.25rem',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className="ti ti-x" />
          </button>
          <span className="text-xs t-text-muted">↳ {parentName}</span>
        </div>
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

      {/* Numéro + Nom */}
      <div className="mb-1">
        {InlineText({ field: 'number', placeholder: 'Numéro', className: 't-text-muted font-mono text-xs block mb-1' })}
      </div>
      <div className="mb-3">
        {InlineText({ field: 'name', placeholder: 'Nom du sous-projet', large: true })}
      </div>

      {/* Statut + progression */}
      <div className="flex items-center gap-3 mb-4">
        <InlineDropdown<Status>
          value={sub.status}
          options={STATUS_ORDER}
          labels={STATUS_LABELS}
          onChange={onChangeStatus}
          triggerClassName={`status-badge s-${sub.status} flex items-center`}
          renderOption={opt => <span className={`status-badge s-${opt}`} style={{ pointerEvents: 'none' }}>{STATUS_LABELS[opt]}</span>}
        />
        <div className="prog-wrap" style={{ width: 100 }}>
          <div className="prog-bar-bg">
            <div className="prog-fill-bg" style={{ width: `${sub.progress ?? 0}%`, background: (sub.progress ?? 0) >= 100 ? 'var(--s-done-fg)' : 'var(--accent)' }} />
          </div>
          <span className="prog-pct">{sub.progress ?? 0}%</span>
        </div>
      </div>

      {/* Dates */}
      <div className="mb-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="t-text-muted shrink-0" style={{ width: 72, fontSize: '0.72rem' }}>Deadline</span>
          {InlineDateField({ field: 'deadline', placeholder: '—' })}
        </div>
        <div className="flex items-center gap-2">
          <span className="t-text-muted shrink-0" style={{ width: 72, fontSize: '0.72rem' }}>Terminé</span>
          {InlineDateField({ field: 'ended', placeholder: '—' })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 16px' }} />

      {/* Notes & historique */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold t-text-muted uppercase tracking-wide">Notes & historique</span>
        </div>

        <textarea
          ref={quickNoteRef}
          value={quickNote}
          placeholder="Ajouter une note…"
          rows={1}
          onChange={e => {
            setQuickNote(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
          onKeyDown={async e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const text = quickNote.trim()
              if (!text || quickNoteSubmittingRef.current) return
              quickNoteSubmittingRef.current = true
              await onQuickAddNote(text)
              setQuickNote('')
              quickNoteSubmittingRef.current = false
              if (quickNoteRef.current) quickNoteRef.current.style.height = 'auto'
            }
            if (e.key === 'Escape') { e.nativeEvent.stopPropagation(); setQuickNote(''); if (quickNoteRef.current) quickNoteRef.current.style.height = 'auto' }
          }}
          onBlur={async () => {
            const text = quickNote.trim()
            if (!text || quickNoteSubmittingRef.current) return
            quickNoteSubmittingRef.current = true
            await onQuickAddNote(text)
            setQuickNote('')
            quickNoteSubmittingRef.current = false
            if (quickNoteRef.current) quickNoteRef.current.style.height = 'auto'
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlurCapture={e => { e.target.style.borderColor = 'var(--border)' }}
          className="w-full resize-none mb-3"
          style={{
            background: 'var(--hover-bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 8px',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            outline: 'none',
            overflowY: 'hidden',
            transition: 'border-color 0.15s',
          }}
        />

        <div className="flex gap-1 mb-3">
          {(['all', 'notes', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setNoteTab(tab); setVisibleCount(5) }}
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

        {filteredNotes.length === 0 && <p className="text-xs t-text-muted">Aucune entrée.</p>}
        {hiddenCount > 0 && (
          <button
            onClick={() => setVisibleCount(c => c + 10)}
            className="w-full text-xs t-text-muted py-1.5 rounded-lg mb-2"
            style={{ border: '1px solid var(--border)' }}
          >
            Voir les {hiddenCount} précédente{hiddenCount > 1 ? 's' : ''}
          </button>
        )}
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
