import { Note, Status } from './types'
import { STATUS_LABELS } from './constants'
import { DONE_PREFIX } from './todo'

export type MilestoneKind = 'status' | 'done' | 'note'

export interface Milestone {
  pos: number            // 0–100, position sur la frise
  kind: MilestoneKind    // type dominant du groupe
  status?: Status        // pour un changement de statut
  noteIds: string[]      // du plus récent au plus ancien
  title: string
}

export function statusFromNoteText(text: string): Status | null {
  if (!text.startsWith('→ ')) return null
  const label = text.slice(2).trim()
  const entry = Object.entries(STATUS_LABELS).find(([, l]) => l === label)
  return entry ? (entry[0] as Status) : null
}

// posOf : date (ms) → position 0–100 sur la frise.
export function buildMilestones(notes: Note[], posOf: (ts: number) => number): Milestone[] {
  const events = notes.map(n => ({ n, ts: new Date(n.created_at).getTime() })).filter(e => !Number.isNaN(e.ts))
  if (!events.length) return []
  const buckets = new Map<number, { kind: MilestoneKind; status?: Status; items: { n: Note; ts: number }[] }>()
  for (const e of events.sort((a, b) => b.ts - a.ts)) {
    const pos = Math.max(0, Math.min(100, posOf(e.ts)))
    const key = Math.round(pos / 3)
    const status = statusFromNoteText(e.n.text)
    const kind: MilestoneKind = status ? 'status' : e.n.text.startsWith(DONE_PREFIX) ? 'done' : 'note'
    const b = buckets.get(key) || { kind, status: status || undefined, items: [] }
    const rank = { status: 3, done: 2, note: 1 }
    if (rank[kind] > rank[b.kind]) { b.kind = kind; b.status = status || undefined }
    if (kind === 'status' && b.kind === 'status' && !b.status) b.status = status || undefined
    b.items.push(e)
    buckets.set(key, b)
  }
  return Array.from(buckets.entries()).map(([key, b]) => {
    const count = b.items.length
    const first = b.items[0]
    const label = b.kind === 'status' && b.status ? `Statut → ${STATUS_LABELS[b.status]}` : b.kind === 'done' ? `Fait : ${first.n.text.slice(DONE_PREFIX.length)}` : first.n.text.split('\n')[0].slice(0, 60)
    return {
      pos: key * 3,
      kind: b.kind,
      status: b.status,
      noteIds: b.items.map(i => i.n.id),
      title: `${new Date(first.ts).toLocaleDateString('fr-FR')} · ${label}${count > 1 ? ` (+${count - 1})` : ''}`,
    }
  })
}
