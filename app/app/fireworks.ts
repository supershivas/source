// Feu d'artifice de l'archivage : joué depuis le bouton de la carte, mais aussi depuis le panneau de détail,
// le menu ⋯, la sélection groupée et mobile (où le bouton de la carte est masqué).
let lastBurst = -Infinity

export function spawnFireworks(originX: number, originY: number) {
  lastBurst = performance.now()
  const colors = ['#ef4444', '#dc2626', '#c0392b', '#f97316', '#fb923c', '#fbbf24', '#ff6b6b']
  const count = 55
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const angle = Math.random() * Math.PI * 2
    const speed = 120 + Math.random() * 380
    const size = 5 + Math.random() * 9
    const color = colors[Math.floor(Math.random() * colors.length)]
    const lifetime = 800 + Math.random() * 700
    const isRect = Math.random() > 0.6
    el.style.cssText = `position:fixed;left:${originX}px;top:${originY}px;width:${size}px;height:${isRect ? size * 0.4 : size}px;border-radius:${isRect ? 2 : 50}%;background:${color};pointer-events:none;z-index:9999;transform:translate(-50%,-50%);will-change:transform,opacity`
    document.body.appendChild(el)
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed
    const gravity = 420
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const x = originX + vx * t
      const y = originY + vy * t + 0.5 * gravity * t * t
      const progress = (now - start) / lifetime
      const opacity = Math.max(0, 1 - progress * progress)
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      el.style.opacity = String(opacity)
      if (opacity > 0) requestAnimationFrame(tick)
      else el.remove()
    }
    requestAnimationFrame(tick)
  }
}

// Joue le feu d'artifice sur la carte du projet si elle est à l'écran, sinon au milieu de l'écran ;
// sans effet si un feu d'artifice vient déjà d'être lancé (bouton de la carte).
export function playArchiveFireworks(projectId?: string) {
  if (performance.now() - lastBurst < 2000) return
  const el = projectId ? document.querySelector<HTMLElement>(`[data-project-id="${projectId}"]`) : null
  const r = el?.getBoundingClientRect()
  if (r && r.bottom > 0 && r.top < window.innerHeight) spawnFireworks(r.left + r.width / 2, r.top + r.height / 2)
  else spawnFireworks(window.innerWidth / 2, window.innerHeight / 2)
}
