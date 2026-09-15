'use client'
import { Subproject } from '../types'

interface DuplicateSubModalProps {
  sub: Subproject
  onDuplicateAsSub: () => void
  onDuplicateAsProject: () => void
  onClose: () => void
}

export default function DuplicateSubModal({ sub, onDuplicateAsSub, onDuplicateAsProject, onClose }: DuplicateSubModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="rounded-xl p-5 w-[340px] t-bg-card"
        style={{ boxShadow: 'var(--card-shadow)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-1">Dupliquer « {sub.name} »</h2>
        <p className="text-xs t-text-muted mb-4">Choisissez où créer la copie.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onDuplicateAsSub}
            className="w-full flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-left transition-colors"
            style={{ background: 'var(--hover-bg)', border: '1px solid var(--border)' }}
          >
            <i className="ti ti-folders" style={{ fontSize: '1rem', color: 'var(--accent)' }} />
            <div>
              <div className="font-medium">Rester sous-projet</div>
              <div className="text-xs t-text-muted">Copie ajoutée au même parent</div>
            </div>
          </button>
          <button
            onClick={onDuplicateAsProject}
            className="w-full flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-left transition-colors"
            style={{ background: 'var(--hover-bg)', border: '1px solid var(--border)' }}
          >
            <i className="ti ti-folder" style={{ fontSize: '1rem', color: 'var(--accent)' }} />
            <div>
              <div className="font-medium">Devenir un projet</div>
              <div className="text-xs t-text-muted">Copie créée comme projet indépendant</div>
            </div>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full text-xs t-text-muted py-1.5 rounded-lg"
          style={{ border: '1px solid var(--border)' }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
