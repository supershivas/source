'use client'
import { useEffect, useRef, useState, ReactNode } from 'react'

export default function InlineDropdown<T extends string>({
  value,
  options,
  labels,
  onChange,
  triggerClassName,
  renderOption,
}: {
  value: T
  options: T[]
  labels: Record<T, string>
  onChange: (v: T) => void
  triggerClassName?: string
  renderOption?: (v: T) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" onMouseDown={e => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : openMenu}
        className={triggerClassName}
        style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
      >
        {labels[value]}
        <i className="ti ti-chevron-down" style={{ fontSize: '0.6rem', marginLeft: '4px', opacity: 0.6 }} />
      </button>
      {open && menuPos && (
        <div
          ref={menuRef}
          className="fixed z-[200] rounded-lg overflow-hidden"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            minWidth: '150px',
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => { e.stopPropagation(); onChange(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
              style={{ background: opt === value ? 'var(--hover-bg, rgba(0,0,0,0.05))' : 'transparent' }}
            >
              {renderOption ? renderOption(opt) : labels[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
