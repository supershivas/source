'use client'
import React from 'react'

// Poignée de la feuille mobile : glisser vers le bas ferme le panneau.
export default function SheetHandle({ panelRef, onClose }: { panelRef: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const startY = React.useRef<number | null>(null)
  const dy = React.useRef(0)

  function move(e: React.TouchEvent) {
    if (startY.current === null || !panelRef.current) return
    dy.current = Math.max(0, e.touches[0].clientY - startY.current)
    panelRef.current.style.transition = 'none'
    panelRef.current.style.transform = `translateY(${dy.current}px)`
  }
  function end() {
    const el = panelRef.current
    startY.current = null
    if (!el) return
    if (dy.current > 100) { onClose(); return }
    el.style.transition = 'transform 0.2s'
    el.style.transform = ''
    dy.current = 0
  }

  return (
    <div
      className="detail-sheet-grab"
      onTouchStart={e => { startY.current = e.touches[0].clientY; dy.current = 0 }}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={end}
    >
      <div className="detail-sheet-handle" />
    </div>
  )
}
