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
