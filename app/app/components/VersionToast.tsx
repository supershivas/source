'use client'
import { useEffect } from 'react'

const STORAGE_KEY = 'source_app_version'
// Posé par PwaUpdater juste avant un rechargement : version qu'on quitte.
export const UPDATED_FROM_KEY = 'source_updated_from'

// Une seule annonce par chargement de page (StrictMode monte deux fois).
let announced = false

// Signale une mise à jour de l'app (« Mis à jour en vX.Y.Z »). Deux sources :
//  - le drapeau sessionStorage posé par `PwaUpdater` avant son rechargement
//    automatique (cas fiable, quel que soit l'état de localStorage) ;
//  - à défaut, l'écart avec la version mémorisée au dernier lancement
//    (mise à jour reçue par une navigation normale).
export default function VersionToast({ onAnnounce }: { onAnnounce: (message: string, duration?: number) => void }) {
  useEffect(() => {
    if (announced) return
    announced = true
    const current = process.env.NEXT_PUBLIC_APP_VERSION
    if (!current) return
    let previous: string | null = null
    let reloadedFrom: string | null = null
    try {
      reloadedFrom = sessionStorage.getItem(UPDATED_FROM_KEY)
      sessionStorage.removeItem(UPDATED_FROM_KEY)
    } catch {}
    try {
      previous = localStorage.getItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_KEY, current)
    } catch {
      return
    }
    // Première ouverture sur cet appareil : rien à annoncer.
    const from = reloadedFrom || previous
    if (!from || from === current) return
    setTimeout(() => onAnnounce(`Mis à jour en v${current}`, 5000), 600)
  }, [onAnnounce])

  return null
}
