'use client'
import { useEffect, useRef, useState } from 'react'
import { Project } from '../types'
import { STATUS_ACCENT } from '../constants'

interface Command {
  id: string
  label: string
  icon: string
  action: () => void
  hint?: string
}

interface CommandPaletteProps {
  projects: Project[]
  onClose: () => void
  onOpenProject: (id: string) => void
  onNewProject: () => void
  onShowDashboard: () => void
  onShowCalendar: () => void
  onExportCSV: () => void
  onShowSettings: () => void
}

export default function CommandPalette({
  projects, onClose, onOpenProject, onNewProject, onShowDashboard, onShowCalendar, onExportCSV, onShowSettings,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const staticCommands: Command[] = [
    { id: 'new',       label: 'Nouveau projet',  icon: 'ti-plus',      action: () => { onClose(); onNewProject() },      hint: 'N' },
    { id: 'dashboard', label: 'Dashboard',        icon: 'ti-chart-bar', action: () => { onClose(); onShowDashboard() },   hint: 'D' },
    { id: 'calendar',  label: 'Calendrier',       icon: 'ti-calendar',  action: () => { onClose(); onShowCalendar() } },
    { id: 'export',    label: 'Export CSV',        icon: 'ti-download',  action: () => { onClose(); onExportCSV() } },
    { id: 'settings',  label: 'Préférences',      icon: 'ti-settings',  action: () => { onClose(); onShowSettings() },   hint: 'P' },
  ]

  const q = query.trim().toLowerCase()
  const matchedProjects = q.length >= 1
    ? projects.filter(p => !p.trashed && (p.name.toLowerCase().includes(q) || p.number.toLowerCase().includes(q))).slice(0, 6)
    : []
  const matchedCommands = staticCommands.filter(c => !q || c.label.toLowerCase().includes(q))

  type Item = { type: 'project'; project: Project } | { type: 'command'; command: Command }
  const items: Item[] = [
    ...matchedProjects.map(p => ({ type: 'project' as const, project: p })),
    ...matchedCommands.map(c => ({ type: 'command' as const, command: c })),
  ]

  function execute(idx: number) {
    const item = items[idx]
    if (!item) return
    if (item.type === 'project') { onClose(); onOpenProject(item.project.id) }
    else item.command.action()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); execute(cursor) }
    if (e.key === 'Escape')    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: 560, background: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <i className="ti ti-search" style={{ color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un projet ou une action…"
            className="flex-1 py-3.5 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--hover-bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {items.length === 0 && (
            <p className="text-sm px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucun résultat</p>
          )}

          {matchedProjects.length > 0 && (
            <div className="px-2 pt-2 pb-1">
              <p className="text-xs px-2 mb-1.5" style={{ color: 'var(--text-muted)' }}>Projets</p>
              {matchedProjects.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { onClose(); onOpenProject(p.id) }}
                  onMouseEnter={() => setCursor(i)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm"
                  style={{ background: cursor === i ? 'var(--hover-bg)' : 'transparent', color: 'var(--text-primary)' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[p.status], flexShrink: 0 }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.number}</span>
                </button>
              ))}
            </div>
          )}

          {matchedCommands.length > 0 && (
            <div className="px-2 pt-1 pb-2">
              {matchedProjects.length > 0 && (
                <p className="text-xs px-2 mb-1.5 mt-1" style={{ color: 'var(--text-muted)' }}>Actions</p>
              )}
              {matchedCommands.map((cmd, i) => {
                const idx = matchedProjects.length + i
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setCursor(idx)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm"
                    style={{ background: cursor === idx ? 'var(--hover-bg)' : 'transparent', color: 'var(--text-primary)' }}
                  >
                    <i className={`ti ${cmd.icon}`} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: 16, textAlign: 'center' }} />
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.hint && (
                      <kbd style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--hover-bg)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>{cmd.hint}</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
