'use client'
import { useState } from 'react'
import { Status } from '../types'
import { STATUS_LABELS, STATUS_ORDER } from '../constants'

interface BulkActionBarProps {
  count: number
  onSetStatus: (s: Status) => void
  onArchive: () => void
  onDelete: () => void
  onDeselect: () => void
}

export default function BulkActionBar({ count, onSetStatus, onArchive, onDelete, onDeselect }: BulkActionBarProps) {
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--text-primary)', color: 'var(--card-bg)',
      borderRadius: 12, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      zIndex: 40, fontSize: '0.8rem', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontWeight: 600, opacity: 0.7, marginRight: 4 }}>
        {count} sélectionné{count > 1 ? 's' : ''}
      </span>

      {/* Status picker */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setStatusOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: 'inherit', fontSize: '0.78rem' }}
        >
          Statut <i className="ti ti-chevron-down" style={{ fontSize: '0.7rem' }} />
        </button>
        {statusOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '4px', minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50,
          }}>
            {STATUS_ORDER.map(s => (
              <button
                key={s}
                onClick={() => { onSetStatus(s); setStatusOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />

      <button
        onClick={onArchive}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: 'inherit', fontSize: '0.78rem' }}
      >
        <i className="ti ti-archive" style={{ fontSize: '0.8rem' }} /> Archiver
      </button>

      <button
        onClick={onDelete}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(192,57,43,0.3)', cursor: 'pointer', color: '#fca5a5', fontSize: '0.78rem' }}
      >
        <i className="ti ti-trash" style={{ fontSize: '0.8rem' }} /> Supprimer
      </button>

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />

      <button
        onClick={onDeselect}
        style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}
      >
        Désélectionner
      </button>
    </div>
  )
}
