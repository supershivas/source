import { Importance, Status } from './types'

export const STATUS_LABELS: Record<Status, string> = {
  ready: 'Ready to start',
  ongoing: 'Ongoing',
  review: 'In review',
  sent: 'Sent to client',
  done: 'Done',
  hold: 'On hold',
}

export const STATUS_ORDER: Status[] = ['ready', 'ongoing', 'review', 'sent', 'done', 'hold']

export const AUTO_PROGRESS: Record<Status, number | null> = {
  ready: 0,
  ongoing: 40,
  review: 70,
  sent: 80,
  done: 100,
  hold: null,
}

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const IMPORTANCE_ORDER: Importance[] = ['low', 'medium', 'high']

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  ready: 's-ready',
  ongoing: 's-ongoing',
  review: 's-review',
  sent: 's-sent',
  done: 's-done',
  hold: 's-hold',
}

export const PROG_COLOR: Record<Status, string> = {
  ready: '#B4B2A9',
  ongoing: '#378ADD',
  review: '#EF9F27',
  sent: '#D4537E',
  done: '#639922',
  hold: '#888780',
}

export const IMPORTANCE_COLOR: Record<Importance, string> = {
  high: '#C0392B',
  medium: '#D4A017',
  low: '#8A8A8A',
}

export function toEU(iso?: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function dlStatus(deadline?: string | null): 'over' | 'warn' | '' {
  if (!deadline) return ''
  const diff = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / 86400000)
  return diff < 0 ? 'over' : diff <= 7 ? 'warn' : ''
}
