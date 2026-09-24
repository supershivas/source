'use client'
import { useEffect } from 'react'

const STORAGE_KEY = 'source_app_version'

// Une seule annonce par chargement de page (StrictMode monte deux fois).
let announced = false

// Signale une mise à jour de l'app. `PwaUpdater` recharge la page tout seul
// quand un nouveau build est en ligne ; on compare la version du bundle
// courant à celle mémorisée au dernier lancement et on annonce l'écart.
export default function VersionToast({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  useEffect(() => {
    if (announced) return
    announced = true
    const current = process.env.NEXT_PUBLIC_APP_VERSION
    if (!current) return
    let previous: string | null = null
    try {
      previous = localStorage.getItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_KEY, current)
    } catch {
      return
    }
    // Première ouverture sur cet appareil : rien à annoncer.
    if (!previous || previous === current) return
    setTimeout(() => onAnnounce(`Mis à jour en v${current}`), 600)
  }, [onAnnounce])

  return null
}
