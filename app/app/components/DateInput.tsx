'use client'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale/fr'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('fr', fr)

interface DateInputProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  className?: string
}

function toDate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function fromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function DateInput({ value, onChange, className }: DateInputProps) {
  return (
    <DatePicker
      locale="fr"
      dateFormat="dd/MM/yyyy"
      selected={toDate(value)}
      onChange={d => onChange(d ? fromDate(d) : '')}
      className={className}
      placeholderText="JJ/MM/AAAA"
      calendarStartDay={1}
      autoComplete="off"
    />
  )
}
