import { useMemo } from 'react'
import { Category, Project } from '../types'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_BADGE_CLASS,
  IMPORTANCE_COLOR,
  toEU,
  dlStatus,
} from '../constants'

interface DashboardProps {
  projects: Project[]
  selectedCat: Category
  selectedYear: number
}

export default function Dashboard({ projects, selectedCat, selectedYear }: DashboardProps) {
  const scope = useMemo(
    () => projects.filter(p => p.cat === selectedCat && p.year === selectedYear && !p.archived && !p.trashed),
    [projects, selectedCat, selectedYear]
  )

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    STATUS_ORDER.forEach(s => (map[s] = 0))
    scope.forEach(p => {
      if (map[p.status] !== undefined) map[p.status]++
    })
    return map
  }, [scope])

  const overdue = scope.filter(p => p.deadline && dlStatus(p.deadline) === 'over' && p.status !== 'done')
  const dueSoon = scope.filter(p => p.deadline && dlStatus(p.deadline) === 'warn' && p.status !== 'done')
  const active = scope.filter(p => p.status !== 'done' && p.status !== 'hold')
  const avgProg = active.length ? Math.round(active.reduce((a, p) => a + (p.progress || 0), 0) / active.length) : 0

  const topClients = useMemo(() => {
    const map: Record<string, number> = {}
    scope.forEach(p => {
      if (p.client)
        p.client
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(c => (map[c] = (map[c] || 0) + 1))
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [scope])

  const impMap = useMemo(() => {
    const map: Record<string, number> = { high: 0, medium: 0, low: 0 }
    scope.forEach(p => (map[p.importance] = (map[p.importance] || 0) + 1))
    return map
  }, [scope])

  const total = scope.length
  const done = byStatus.done || 0
  const cr = total ? Math.round((done / total) * 100) : 0

  const topEditors = useMemo(() => {
    const map: Record<string, number> = {}
    scope.forEach(p => {
      if (p.editor) {
        const e = p.editor.trim()
        if (e) map[e] = (map[e] || 0) + 1
      }
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [scope])

  const weekBuckets = useMemo(() => {
    const allNotes = scope.flatMap(p => [
      ...(p.notes || []).map(n => n.created_at),
      ...(p.subprojects || []).flatMap(s => (s.notes || []).map(n => n.created_at)),
    ])
    const now = new Date()
    const buckets: { label: string; start: Date; count: number }[] = []
    for (let w = 7; w >= 0; w--) {
      const d = new Date(now)
      d.setDate(d.getDate() - w * 7)
      buckets.push({ label: `S-${w}`, start: d, count: 0 })
    }
    allNotes.forEach(date => {
      if (!date) return
      const nd = new Date(date)
      buckets.forEach((b, i) => {
        const end = i < buckets.length - 1 ? buckets[i + 1].start : new Date(now.getTime() + 86400000)
        if (nd >= b.start && nd < end) b.count++
      })
    })
    return buckets
  }, [scope])

  const maxNoteCount = Math.max(1, ...weekBuckets.map(b => b.count))

  const subCompletion = useMemo(() => {
    return scope
      .filter(p => (p.subprojects || []).length > 0)
      .map(p => {
        const subs = (p.subprojects || []).filter(s => !s.archived)
        const doneSubs = subs.filter(s => s.status === 'done').length
        return {
          number: p.number,
          name: p.name,
          done: doneSubs,
          total: subs.length,
          pct: subs.length ? Math.round((doneSubs / subs.length) * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [scope])

  const archivedCount = projects.filter(
    p => p.cat === selectedCat && p.year === selectedYear && p.archived && !p.trashed
  ).length

  const cardClass = 't-bg-card rounded-xl p-4'
  const cardStyle = { boxShadow: 'var(--card-shadow)' }
  const titleClass = 't-text text-sm font-semibold mb-3 flex items-center gap-2'

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Par statut</div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map(s => (
              <div key={s} className="flex items-center justify-between gap-2 text-sm">
                <span className={`status-badge ${STATUS_BADGE_CLASS[s]}`}>{STATUS_LABELS[s]}</span>
                <span className="t-text font-semibold">{byStatus[s] || 0}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="t-text-muted text-xs">Completion</span>
            <div className="prog-wrap flex-1 relative h-2 rounded overflow-hidden" style={{ background: 'var(--prog-bg, rgba(0,0,0,0.08))' }}>
              <div className="prog-fill-bg" style={{ width: `${cr}%`, background: 'var(--s-done-fg)' }} />
            </div>
            <strong className="text-xs" style={{ color: 'var(--s-done-fg)' }}>{cr}%</strong>
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Alertes</div>
          {overdue.length === 0 && dueSoon.length === 0 ? (
            <p className="t-text-muted text-sm">✓ Aucune deadline critique</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {overdue.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="t-text-muted text-xs">{p.number}</span>
                  <span className="t-text flex-1 truncate">{p.name}</span>
                  <span className="text-xs" style={{ color: '#C0392B' }}>☠ {toEU(p.deadline)}</span>
                </div>
              ))}
              {dueSoon.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="t-text-muted text-xs">{p.number}</span>
                  <span className="t-text flex-1 truncate">{p.name}</span>
                  <span className="text-xs" style={{ color: '#D4A017' }}>⚠ {toEU(p.deadline)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Avancement</div>
          <div className="text-3xl font-bold t-text">{avgProg}%</div>
          <p className="t-text-muted text-xs mt-1">
            {active.length} projet{active.length > 1 ? 's' : ''} actif{active.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Importance</div>
          <div className="flex flex-col gap-2">
            {(['high', 'medium', 'low'] as const).map(k => (
              <div key={k} className="flex items-center gap-2">
                <span className="rounded-full" style={{ width: 8, height: 8, background: IMPORTANCE_COLOR[k] }} />
                <span className="text-xs t-text flex-1 capitalize">{k}</span>
                <strong className="text-xs t-text">{impMap[k]}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Top clients</div>
          {topClients.length === 0 ? (
            <p className="t-text-muted text-sm">Aucun client</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topClients.map(([c, n]) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="t-text flex-1 truncate">{c}</span>
                  <span className="t-text-muted">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Résumé</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between"><span className="t-text-muted">Total</span><strong className="t-text">{total}</strong></div>
            <div className="flex justify-between"><span className="t-text-muted">Terminés</span><strong style={{ color: 'var(--s-done-fg)' }}>{done}</strong></div>
            <div className="flex justify-between"><span className="t-text-muted">En retard</span><strong style={{ color: '#C0392B' }}>{overdue.length}</strong></div>
            <div className="flex justify-between"><span className="t-text-muted">Deadline proche</span><strong style={{ color: '#D4A017' }}>{dueSoon.length}</strong></div>
            <div className="flex justify-between"><span className="t-text-muted">Archivés</span><strong className="t-text-muted">{archivedCount}</strong></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedCat === 'pro' && (
          <div className={cardClass} style={cardStyle}>
            <div className={titleClass}>Par éditeur</div>
            {topEditors.length === 0 ? (
              <p className="t-text-muted text-sm">Aucun éditeur</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {topEditors.map(([e, n]) => (
                  <div key={e} className="flex items-center gap-2 text-xs">
                    <span className="t-text flex-1 truncate">{e}</span>
                    <span className="t-text-muted">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Notes (8 semaines)</div>
          <div className="flex items-end gap-1" style={{ height: 50 }}>
            {weekBuckets.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  title={`${b.count} note${b.count > 1 ? 's' : ''}`}
                  style={{
                    width: '100%',
                    background: 'var(--accent)',
                    borderRadius: '3px 3px 0 0',
                    height: Math.round((b.count / maxNoteCount) * 40) + 2,
                    opacity: b.count ? 1 : 0.2,
                  }}
                />
                <span className="text-[9px] t-text-muted">{b.count || ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {subCompletion.length > 0 && (
        <div className={cardClass} style={cardStyle}>
          <div className={titleClass}>Complétion sous-projets</div>
          <div className="flex flex-col gap-2">
            {subCompletion.map(s => (
              <div key={s.number} className="flex items-center gap-2">
                <span className="t-text-muted text-xs truncate" style={{ minWidth: 80 }}>{s.number}</span>
                <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div className="h-full rounded" style={{ width: `${s.pct}%`, background: 'var(--s-done-fg)' }} />
                </div>
                <span className="t-text-muted text-xs" style={{ minWidth: 40, textAlign: 'right' }}>{s.done}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
