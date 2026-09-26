'use client'
import { useEffect, useRef, useState } from 'react'
import { Project } from '../types'
import Changelog from './Changelog'
import ConfirmModal from './ConfirmModal'
import { parseBackup, Backup } from '../importBackup'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'compact' | 'normal' | 'large'

const FONT_SCALE: Record<FontSize, string> = {
  compact: '87.5%',
  normal: '100%',
  large: '112.5%',
}

const PK = 'source-prefs'

interface Prefs {
  theme: ThemeMode
  fontSize: FontSize
}

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return { theme: 'system', fontSize: 'normal' }
  try {
    const raw = localStorage.getItem(PK)
    if (raw) return { theme: 'system', fontSize: 'normal', ...JSON.parse(raw) }
  } catch {}
  return { theme: 'system', fontSize: 'normal' }
}

function applyPrefs(p: Prefs) {
  const html = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = p.theme === 'dark' || (p.theme === 'system' && prefersDark)
  html.classList.toggle('dark', isDark)
  html.style.fontSize = FONT_SCALE[p.fontSize]
}

export function useSettingsPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())

  useEffect(() => {
    applyPrefs(prefs)
    try {
      localStorage.setItem(PK, JSON.stringify(prefs))
    } catch {}
  }, [prefs])

  return { prefs, setPrefs }
}

interface SettingsModalProps {
  prefs: Prefs
  onChange: (patch: Partial<Prefs>) => void
  onClose: () => void
  onLogout: () => void
  userId: string
  userEmail?: string
  projects: Project[]
  onImport: (backup: Backup) => Promise<void>
}

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Export complet (projets, sous-projets, notes, corbeille et archives
// compris) dans un fichier JSON téléchargeable.
function exportJSON(projects: Project[]) {
  const data = {
    app: 'source',
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    exported_at: new Date().toISOString(),
    projects,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `source_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsModal({ prefs, onChange, onClose, onLogout, userId, userEmail, projects, onImport }: SettingsModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)
    try {
      setPending(parseBackup(await file.text()))
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  async function confirmImport() {
    if (!pending || importing) return
    setImporting(true)
    try {
      await onImport(pending)
      setPending(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import impossible.')
      setPending(null)
    } finally {
      setImporting(false)
    }
  }

  const activeProjects = projects.filter(p => !p.trashed && !p.archived).length
  const activeSubprojects = projects.reduce(
    (n, p) => n + (p.subprojects?.filter(s => !s.trashed && !s.archived).length || 0),
    0
  )
  const archivedCount = projects.filter(p => !p.trashed && p.archived).length
  const trashedCount = projects.filter(p => p.trashed).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="t-text text-base font-semibold">Réglages</h2>
          <button onClick={onClose} className="t-text-muted">
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Apparence</p>
            <div className="flex gap-2 mb-2">
              {([
                { value: 'light', label: 'Clair', icon: 'ti-sun' },
                { value: 'dark', label: 'Sombre', icon: 'ti-moon' },
                { value: 'system', label: 'Système', icon: 'ti-device-desktop' },
              ] as { value: ThemeMode; label: string; icon: string }[]).map(t => (
                <button
                  key={t.value}
                  onClick={() => onChange({ theme: t.value })}
                  className="flex-1 flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-sm t-text"
                  style={{
                    borderColor: prefs.theme === t.value ? 'var(--accent)' : 'var(--border)',
                    background: prefs.theme === t.value ? 'var(--accent-muted)' : 'transparent',
                  }}
                >
                  <i className={`ti ${t.icon}`} />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['compact', 'normal', 'large'] as FontSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ fontSize: s })}
                  className="flex-1 rounded-lg border px-3 py-2 t-text"
                  style={{
                    borderColor: prefs.fontSize === s ? 'var(--accent)' : 'var(--border)',
                    background: prefs.fontSize === s ? 'var(--accent-muted)' : 'transparent',
                    fontSize: s === 'compact' ? '0.8rem' : s === 'large' ? '1.1rem' : '0.95rem',
                  }}
                >
                  A
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Compte</p>
            <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5" style={{ background: 'var(--hover-bg)' }}>
              {userEmail && (
                <div className="flex items-center justify-between">
                  <span className="t-text-muted text-xs">Email</span>
                  <span className="t-text text-xs font-mono">{userEmail}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="t-text-muted text-xs">ID</span>
                <span className="t-text-muted text-xs font-mono truncate max-w-40">{userId.slice(0, 8)}…</span>
              </div>
            </div>
          </div>

          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Contenu</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Projets', value: activeProjects, icon: 'ti-folder' },
                { label: 'Sous-projets', value: activeSubprojects, icon: 'ti-subtask' },
                { label: 'Archivés', value: archivedCount, icon: 'ti-archive' },
                { label: 'Corbeille', value: trashedCount, icon: 'ti-trash' },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: 'var(--hover-bg)' }}>
                  <i className={`ti ${s.icon} t-text-muted`} style={{ fontSize: '16px' }} />
                  <div>
                    <p className="t-text text-sm font-semibold">{s.value}</p>
                    <p className="t-text-muted text-[10px]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Applications</p>
            <div className="flex gap-2">
              {[
                { name: 'Idée', url: 'https://idee-neon.vercel.app/', favicon: 'https://idee-neon.vercel.app/favicon.ico' },
                { name: 'AutoCompare', url: 'https://supershivas.github.io/projetV/', favicon: 'https://supershivas.github.io/projetV/favicon.ico' },
                { name: 'Portfolio', url: 'https://stockportfolio-five.vercel.app/', favicon: 'https://stockportfolio-five.vercel.app/favicon.ico' },
              ].map(app => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-colors"
                  style={{ background: 'var(--hover-bg)' }}
                  title={app.name}
                >
                  <img src={app.favicon} alt="" width={20} height={20} className="rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <span className="t-text-muted text-[10px]">{app.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Sauvegarde</p>
            <button
              onClick={() => exportJSON(projects)}
              className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-colors"
              style={{ background: 'var(--hover-bg)' }}
            >
              <i className="ti ti-download t-text-muted" style={{ fontSize: '16px' }} />
              <span className="flex-1">
                <span className="t-text text-sm font-medium block">Exporter mes données</span>
                <span className="t-text-muted text-xs">Tous les projets, sous-projets et notes, en JSON</span>
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="mt-2 w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-colors"
              style={{ background: 'var(--hover-bg)' }}
            >
              <i className="ti ti-upload t-text-muted" style={{ fontSize: '16px' }} />
              <span className="flex-1">
                <span className="t-text text-sm font-medium block">{importing ? 'Restauration…' : 'Restaurer une sauvegarde'}</span>
                <span className="t-text-muted text-xs">Depuis un fichier exporté ci-dessus</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
            {importError && <p className="mt-2 text-xs" style={{ color: 'var(--s-sent-fg)' }}>{importError}</p>}
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--s-sent-fg)', color: 'var(--s-sent-fg)' }}
          >
            Se déconnecter
          </button>

          <div>
            <p className="text-center text-[11px]" style={{ color: 'var(--text-faint)' }}>
              Version {process.env.NEXT_PUBLIC_APP_VERSION}
              {process.env.NEXT_PUBLIC_APP_UPDATED_AT && (
                <> · Mis à jour le {formatUpdatedAt(process.env.NEXT_PUBLIC_APP_UPDATED_AT)}</>
              )}
            </p>
            <Changelog />
          </div>
        </div>

        {pending && (
          <ConfirmModal
            title="Restaurer cette sauvegarde ?"
            message={`${pending.projects.length} projets, ${pending.subprojects.length} sous-projets et ${pending.notes.length} notes seront réécrits tels qu'enregistrés dans le fichier. Ce qui n'y figure pas est conservé ; rien n'est supprimé.`}
            confirmLabel="Restaurer"
            onConfirm={confirmImport}
            onClose={() => setPending(null)}
          />
        )}
      </div>
    </div>
  )
}
