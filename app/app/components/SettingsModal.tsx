'use client'
import { useEffect, useState } from 'react'
import { Project } from '../types'

export type ThemeMode = 'light' | 'dark'
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
  if (typeof window === 'undefined') return { theme: 'light', fontSize: 'normal' }
  try {
    const raw = localStorage.getItem(PK)
    if (raw) return { theme: 'light', fontSize: 'normal', ...JSON.parse(raw) }
  } catch {}
  return { theme: 'light', fontSize: 'normal' }
}

function applyPrefs(p: Prefs) {
  const html = document.documentElement
  html.classList.toggle('dark', p.theme === 'dark')
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
}

export default function SettingsModal({ prefs, onChange, onClose, onLogout, userId, userEmail, projects }: SettingsModalProps) {
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
              {(['light', 'dark'] as ThemeMode[]).map(t => (
                <button
                  key={t}
                  onClick={() => onChange({ theme: t })}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm t-text"
                  style={{
                    borderColor: prefs.theme === t ? 'var(--accent)' : 'var(--border)',
                    background: prefs.theme === t ? 'var(--accent-muted)' : 'transparent',
                  }}
                >
                  {t === 'light' ? '☀️ Clair' : '🌙 Sombre'}
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

          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--s-sent-fg)', color: 'var(--s-sent-fg)' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
