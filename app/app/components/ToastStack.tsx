interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'archive'
  action?: { label: string; onClick: () => void }
}

interface ToastStackProps {
  toasts: Toast[]
}

export type { Toast }

export default function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) return null

  const colors: Record<Toast['type'], { bg: string; fg: string; icon: string }> = {
    success: { bg: 'var(--s-done-bg)', fg: 'var(--s-done-fg)', icon: 'ti-circle-check' },
    error: { bg: 'var(--s-sent-bg)', fg: 'var(--s-sent-fg)', icon: 'ti-circle-x' },
    info: { bg: 'var(--s-ongoing-bg)', fg: 'var(--s-ongoing-fg)', icon: 'ti-info-circle' },
    archive: { bg: '#3b0a0a', fg: '#fca5a5', icon: 'ti-archive' },
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-1.5 pointer-events-none">
      {toasts.map(t => {
        const c = colors[t.type]
        const isArchive = t.type === 'archive'
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-lg toast-animate-in${isArchive ? ' toast-archive' : ''}${t.action ? ' pointer-events-auto' : ''}`}
            style={{ background: c.bg, color: c.fg }}
          >
            <i className={`ti ${c.icon}`} />
            <span>{t.message}</span>
            {isArchive && <span style={{ marginLeft: 2, fontSize: '0.9em' }}>✦</span>}
            {t.action && (
              <button
                onClick={t.action.onClick}
                className="ml-1 rounded px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.18)', color: c.fg, border: '1px solid rgba(255,255,255,0.3)' }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
