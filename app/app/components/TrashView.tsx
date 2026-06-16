import { Project } from '../types'

interface TrashViewProps {
  projects: Project[]
  onRestore: (id: string) => void
  onDeleteForever: (id: string) => void
}

export default function TrashView({ projects, onRestore, onDeleteForever }: TrashViewProps) {
  if (projects.length === 0) {
    return <p className="t-text-muted text-sm">La corbeille est vide.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {projects.map(p => (
        <div
          key={p.id}
          className="t-bg-card rounded-lg p-3 flex items-center gap-3"
          style={{ boxShadow: 'var(--card-shadow)', opacity: 0.8 }}
        >
          <span className="text-xs t-text-muted w-10 shrink-0">{p.number}</span>
          <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
          <button
            onClick={() => onRestore(p.id)}
            title="Restaurer"
            className="sidebar-icon-btn rounded p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <i className="ti ti-arrow-back-up" />
          </button>
          <button
            onClick={() => onDeleteForever(p.id)}
            title="Supprimer définitivement"
            className="sidebar-icon-btn rounded p-1"
            style={{ color: 'var(--s-sent-fg)' }}
          >
            <i className="ti ti-trash-x" />
          </button>
        </div>
      ))}
    </div>
  )
}
