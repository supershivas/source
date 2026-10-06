'use client'
import { useState } from 'react'
import DateInput from './DateInput'

const pad = (n: number) => String(n).padStart(2, '0')
const toDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Date d'une note, modifiable d'un clic : on change le jour, l'heure est conservée.
export default function NoteDate({ iso, onChange, className = 'text-xs t-text-muted' }: { iso: string; onChange: (day: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false)
  const label = new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  if (editing) {
    return (
      <span onClick={e => e.stopPropagation()}>
        <DateInput value={toDay(iso)} onChange={v => { setEditing(false); if (v && v !== toDay(iso)) onChange(v) }} className="inline-edit-input text-xs" />
      </span>
    )
  }
  return (
    <button onClick={e => { e.stopPropagation(); setEditing(true) }} title="Cliquer pour modifier la date" className={`${className} inline-edit-display`} style={{ display: 'inline-block', width: 'auto' }}>
      {label}
    </button>
  )
}
