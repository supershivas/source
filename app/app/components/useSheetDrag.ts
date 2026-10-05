import React, { useRef } from 'react'

// Feuille mobile : un glissement vers le bas, depuis n'importe où dans le
// panneau tant qu'il est défilé tout en haut, le suit au doigt puis le ferme
// au-delà de CLOSE_AT px. Sinon il revient en place.
const CLOSE_AT = 120

export function useSheetDrag(panelRef: React.RefObject<HTMLDivElement | null>, onClose: () => void, enabled: boolean) {
  const startY = useRef(0)
  const atTop = useRef(false)
  const dy = useRef(0)
  const dragging = useRef(false)

  if (!enabled) return {}
  return {
    onTouchStart(e: React.TouchEvent) {
      startY.current = e.touches[0].clientY
      atTop.current = (panelRef.current?.scrollTop ?? 0) <= 0
      dy.current = 0
      dragging.current = false
    },
    onTouchMove(e: React.TouchEvent) {
      const el = panelRef.current
      if (!el) return
      const delta = e.touches[0].clientY - startY.current
      if (!dragging.current) {
        if (!atTop.current || delta <= 6 || el.scrollTop > 0) return
        dragging.current = true
      }
      dy.current = Math.max(0, delta)
      el.style.transition = 'none'
      el.style.transform = `translateY(${dy.current}px)`
    },
    onTouchEnd() {
      const el = panelRef.current
      if (!dragging.current || !el) return
      dragging.current = false
      if (dy.current > CLOSE_AT) { onClose(); return }
      el.style.transition = 'transform 0.2s'
      el.style.transform = ''
    },
  }
}
