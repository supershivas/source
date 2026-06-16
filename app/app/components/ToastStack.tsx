interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
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
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-1.5 pointer-events-none">
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-lg"
            style={{ background: c.bg, color: c.fg }}
          >
            <i className={`ti ${c.icon}`} />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
