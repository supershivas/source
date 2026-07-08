'use client'
import { useEffect, useRef, useState } from 'react'
import { Note, Status, Subproject } from '../types'
import { STATUS_LABELS, STATUS_ACCENT, STATUS_ORDER, toEU, dlStatus } from '../constants'
import InlineDropdown from './InlineDropdown'

interface SubprojectCardProps {
  sub: Subproject
  parentId: string
  dimmed?: boolean
  onOpenDetail: () => void
  onChangeStatus: (status: Status) => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export default function SubprojectCard({
  sub,
  parentId: _parentId,
  dimmed,
  onOpenDetail,
  onChangeStatus,
  onEdit,
  onDelete,
  onDuplicate,
}: SubprojectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const noteCount = (sub.notes || []).length
  const dls = dlStatus(sub.deadline)
  const dlClass = dls === 'over' ? 'dl-over' : dls === 'warn' ? 'dl-warn' : ''

  return (
    <div
      className="t-bg-card rounded-lg p-3 cursor-pointer relative overflow-visible"
      style={{
        boxShadow: 'var(--card-shadow)',
        borderLeft: `3px solid ${STATUS_ACCENT[sub.status]}`,
        marginLeft: 32,
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 0.2s',
      }}
      onClick={onOpenDetail}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 min-w-0 proj-num-row">
            <span className="text-xs t-text-muted shrink-0 whitespace-nowrap" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {sub.number}
            </span>
            {noteCount > 0 && (
              <span className="notes-bubble" title={`${noteCount} note${noteCount > 1 ? 's' : ''}`}>
                <i className="ti ti-note" style={{ fontSize: '0.6rem' }} /> {noteCount}
              </span>
            )}
            <span className="text-sm font-medium truncate">{sub.name}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <InlineDropdown<Status>
              value={sub.status}
              options={STATUS_ORDER}
              labels={STATUS_LABELS}
              onChange={onChangeStatus}
              triggerClassName={`status-badge s-${sub.status} flex items-center`}
              triggerStyle={{ fontSize: '0.62rem', padding: '2px 7px' }}
              renderOption={opt => (
                <span className={`status-badge s-${opt}`} style={{ pointerEvents: 'none' }}>{STATUS_LABELS[opt]}</span>
              )}
            />
            <div className="prog-wrap" style={{ width: 80, flexShrink: 0 }}>
              <div className="prog-bar-bg">
                <div className="prog-fill-bg" style={{ width: `${sub.progress ?? 0}%`, background: (sub.progress ?? 0) >= 100 ? 'var(--s-done-fg)' : 'var(--accent)' }} />
              </div>
              <span className="prog-pct">{sub.progress ?? 0}%</span>
            </div>
            {sub.deadline && (
              <span className={`tag-chip ${dlClass}`}>☠ {toEU(sub.deadline)}</span>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className="sidebar-icon-btn rounded p-1"
          title="Modifier"
          style={{ color: 'var(--text-primary)' }}
        >
          <i className="ti ti-edit" />
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
    </div>
  )
}

