'use client'
import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
export type FontSize = 'compact' | 'normal' | 'large'
export type AccentKey = 'crimson' | 'gold' | 'blue' | 'green' | 'purple'

const ACCENTS: Record<AccentKey, { color: string; hover: string }> = {
  crimson: { color: '#C0392B', hover: '#9B2D22' },
  gold: { color: '#C9973A', hover: '#A67828' },
  blue: { color: '#2563EB', hover: '#1D4ED8' },
  green: { color: '#16A34A', hover: '#15803D' },
  purple: { color: '#7C3AED', hover: '#6D28D9' },
}

const FONT_SCALE: Record<FontSize, string> = {
  compact: '87.5%',
  normal: '100%',
  large: '112.5%',
}

const PK = 'source-prefs'

interface Prefs {
  theme: ThemeMode
  fontSize: FontSize
  accent: AccentKey
}

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return { theme: 'light', fontSize: 'normal', accent: 'crimson' }
  try {
    const raw = localStorage.getItem(PK)
    if (raw) return { theme: 'light', fontSize: 'normal', accent: 'crimson', ...JSON.parse(raw) }
  } catch {}
  return { theme: 'light', fontSize: 'normal', accent: 'crimson' }
}

function applyPrefs(p: Prefs) {
  const html = document.documentElement
  html.classList.toggle('dark', p.theme === 'dark')
  html.style.fontSize = FONT_SCALE[p.fontSize]
  const a = ACCENTS[p.accent]
  html.style.setProperty('--accent', a.color)
  html.style.setProperty('--accent-hover', a.hover)
  html.style.setProperty('--btn-primary-bg', a.color)
  html.style.setProperty('--btn-primary-hover', a.hover)
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
}

export default function SettingsModal({ prefs, onChange, onClose }: SettingsModalProps) {
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
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Thème</p>
            <div className="flex gap-2">
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
          </div>

          <div>
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Taille du texte</p>
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
            <p className="t-text-muted text-xs uppercase tracking-wide mb-2">Couleur d'accent</p>
            <div className="flex gap-2">
              {(Object.keys(ACCENTS) as AccentKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => onChange({ accent: key })}
                  title={key}
                  className="rounded-full"
                  style={{
                    width: 24,
                    height: 24,
                    background: ACCENTS[key].color,
                    border: prefs.accent === key ? '2px solid var(--text-muted)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
