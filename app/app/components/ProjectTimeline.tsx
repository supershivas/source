'use client'
import React from 'react'
import { Note } from '../types'
import { STATUS_ACCENT } from '../constants'
import { buildMilestones, Milestone } from '../milestones'
import DateInput from './DateInput'

// Repères civils de la frise : voir le labo (Frise du projet) pour comparer les styles.
export type CivilStyle = 'none' | 'ticks' | 'bands' | 'grid' | 'flags' | 'dots'
export const CIVIL_STYLE: CivilStyle = 'grid'

type DateField = 'date' | 'deadline' | 'ended'

interface Props {
  date?: string | null
  deadline?: string | null
  ended?: string | null
  notes: Note[]
  civil?: CivilStyle
  focusNoteId?: string | null
  editing?: DateField | null
  readOnly?: boolean
  now?: number
  onStartEdit?: (field: DateField) => void
  onChangeDate?: (field: DateField, value: string | null) => void
  onRevealNote?: (id: string) => void
}

const DAY = 86400000
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const POINTS: { field: DateField; label: string; color: string }[] = [
  { field: 'date', label: 'Début', color: '#16a34a' },
  { field: 'deadline', label: 'Deadline', color: '#dc2626' },
  { field: 'ended', label: 'Fin', color: '#6366f1' },
]

const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : null)
const fmtShort = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

interface MonthTick { pos: number; month: number; year: number }

function monthTicks(start: number, end: number, posOf: (t: number) => number): MonthTick[] {
  const out: MonthTick[] = []
  let d = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1)
  while (d.getTime() < end) {
    out.push({ pos: posOf(d.getTime()), month: d.getMonth(), year: d.getFullYear() })
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  }
  return out
}

// Étiquette d'un mois selon la durée affichée : tous les mois, leur initiale, puis les trimestres.
function monthLabel(t: MonthTick, spanMonths: number): string | null {
  if (t.month === 0) return String(t.year)
  if (spanMonths <= 8) return MONTHS_SHORT[t.month]
  if (spanMonths <= 18) return MONTHS_SHORT[t.month][0].toUpperCase()
  if (spanMonths <= 40 && t.month % 3 === 0) return MONTHS_SHORT[t.month]
  return null
}

export default function ProjectTimeline({ date, deadline, ended, notes, civil = CIVIL_STYLE, focusNoteId, editing, readOnly, now = Date.now(), onStartEdit, onChangeDate, onRevealNote }: Props) {
  const values: Record<DateField, string | null | undefined> = { date, deadline, ended }
  const noteTs = notes.map(n => new Date(n.created_at).getTime()).filter(t => !Number.isNaN(t))
  const startTs = Math.min(ts(date) ?? Infinity, ...noteTs, now)
  // La frise va du début jusqu'à la dernière échéance connue (deadline ou fin), ou jusqu'à aujourd'hui.
  // Un projet terminé s'arrête à sa fin (ou à sa deadline si elle est postérieure) ; sinon la frise va jusqu'à aujourd'hui.
  const finished = ts(ended) != null && (ts(ended) as number) <= now
  let endTs = Math.max(ts(deadline) ?? 0, ts(ended) ?? 0, finished ? 0 : now)
  if (endTs - startTs < 14 * DAY) endTs = startTs + 14 * DAY
  const posOf = (t: number) => Math.max(0, Math.min(100, ((t - startTs) / (endTs - startTs)) * 100))
  const milestones = buildMilestones(notes, posOf)
  const todayPos = posOf(now)
  const spanMonths = (endTs - startTs) / (30.4 * DAY)
  const ticks = civil === 'none' ? [] : monthTicks(startTs, endTs, posOf)
  const firstYearTick = ticks.find(t => t.month === 0)
  const startYear = new Date(startTs).getFullYear()
  const missing = POINTS.filter(p => !values[p.field])
  // Repères Début / Deadline / Fin : quand ils sont proches, leurs étiquettes se décalent sur plusieurs rangées.
  const ROW_H = 26
  const rowEnd: number[] = []
  const placed = POINTS.filter(p => values[p.field])
    .map(p => ({ ...p, iso: values[p.field]!, pos: posOf(new Date(values[p.field]!).getTime()) }))
    .sort((a, b) => a.pos - b.pos)
    .map(m => {
      let row = rowEnd.findIndex(end => m.pos - end >= 16)
      if (row === -1) row = rowEnd.length
      rowEnd[row] = m.pos
      return { ...m, row }
    })
  const maxRow = placed.reduce((r, m) => Math.max(r, m.row), 0)
  const hasCivil = civil !== 'none'

  function milestoneStyle(m: Milestone): React.CSSProperties {
    if (m.kind === 'status') return { background: m.status ? STATUS_ACCENT[m.status] : 'var(--text-muted)', borderColor: 'var(--card-bg)' }
    if (m.kind === 'done') return { background: '#16a34a', borderColor: 'var(--card-bg)' }
    return { background: 'var(--card-bg)', borderColor: 'var(--text-muted)' }
  }

  const civilLabel: React.CSSProperties = { position: 'absolute', bottom: 9, fontSize: '0.55rem', color: 'var(--text-muted)', transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none', lineHeight: 1 }
  const yearLabel: React.CSSProperties = { ...civilLabel, color: 'var(--text-primary)', fontWeight: 700 }

  function civilLayer() {
    if (!hasCivil) return null
    const showEdgeYear = !firstYearTick || firstYearTick.pos > 14
    // Le premier mois ne s'écrit pas s'il toucherait l'année affichée au bord gauche.
    const label = (t: MonthTick) => (showEdgeYear && t.pos < 9 ? null : monthLabel(t, spanMonths))
    const edgeYear = showEdgeYear
      ? <span style={{ ...civilLabel, left: 0, transform: 'none', color: 'var(--text-muted)', fontWeight: 600 }}>{startYear}</span>
      : null
    if (civil === 'ticks') return <>
      {edgeYear}
      {ticks.map((t, i) => {
        const year = t.month === 0
        const l = label(t)
        return <React.Fragment key={i}>
          <span style={{ position: 'absolute', left: `${t.pos}%`, top: '50%', width: year ? 1.5 : 1, height: year ? 18 : 9, transform: 'translate(-50%,-50%)', background: 'var(--text-muted)', opacity: year ? 0.85 : 0.45, pointerEvents: 'none' }} />
          {l && <span style={{ ...(year ? yearLabel : civilLabel), left: `${t.pos}%`, bottom: year ? 12 : 9 }}>{l}</span>}
        </React.Fragment>
      })}
    </>
    if (civil === 'bands') {
      const edges = [0, ...ticks.map(t => t.pos), 100]
      return <>
        {edges.slice(0, -1).map((e, i) => (
          <span key={i} style={{ position: 'absolute', left: `${e}%`, width: `${edges[i + 1] - e}%`, top: -6, height: 16, background: i % 2 ? 'color-mix(in srgb, var(--text-muted) 14%, transparent)' : 'color-mix(in srgb, var(--text-muted) 6%, transparent)', pointerEvents: 'none' }} />
        ))}
        {edgeYear}
        {ticks.map((t, i) => {
          const l = label(t)
          return l ? <span key={i} style={{ ...(t.month === 0 ? yearLabel : civilLabel), left: `${t.pos}%`, bottom: 12 }}>{l}</span> : null
        })}
      </>
    }
    if (civil === 'grid') return <>
      {edgeYear}
      {ticks.map((t, i) => {
        const year = t.month === 0
        const q = t.month % 3 === 0
        const l = year ? String(t.year) : q && spanMonths > 8 ? MONTHS_SHORT[t.month] : spanMonths <= 8 ? MONTHS_SHORT[t.month] : null
        return <React.Fragment key={i}>
          <span style={{ position: 'absolute', left: `${t.pos}%`, top: -22, bottom: -34, borderLeft: `1px ${year ? 'solid' : 'dashed'} var(--border)`, pointerEvents: 'none' }} />
          {l && <span style={{ ...(year ? yearLabel : civilLabel), left: `${t.pos}%`, bottom: 16 }}>{l}</span>}
        </React.Fragment>
      })}
    </>
    if (civil === 'flags') return <>
      {edgeYear}
      {ticks.map((t, i) => t.month === 0
        ? <React.Fragment key={i}>
            <span style={{ position: 'absolute', left: `${t.pos}%`, top: -22, height: 26, borderLeft: '1.5px solid var(--text-primary)', pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', left: `${t.pos}%`, top: -24, marginLeft: 1.5, fontSize: '0.55rem', fontWeight: 700, background: 'var(--text-primary)', color: 'var(--card-bg)', padding: '1px 4px', borderRadius: '0 3px 3px 0', pointerEvents: 'none', lineHeight: 1.2 }}>{t.year}</span>
          </React.Fragment>
        : t.month % 3 === 0 ? <span key={i} style={{ position: 'absolute', left: `${t.pos}%`, top: '50%', width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} /> : null)}
    </>
    // dots
    return <>
      {edgeYear}
      {ticks.map((t, i) => {
        const year = t.month === 0
        return <React.Fragment key={i}>
          <span style={{ position: 'absolute', left: `${t.pos}%`, top: '50%', width: year ? 9 : 3, height: year ? 9 : 3, borderRadius: '50%', background: year ? 'var(--card-bg)' : 'var(--text-muted)', border: year ? '1.5px solid var(--text-primary)' : 'none', transform: 'translate(-50%,-50%)', opacity: year ? 1 : 0.5, pointerEvents: 'none' }} />
          {year && <span style={{ ...yearLabel, left: `${t.pos}%`, bottom: 12 }}>{t.year}</span>}
        </React.Fragment>
      })}
    </>
  }

  return (
    <div className="mb-3" style={{ paddingTop: hasCivil ? 34 : 18, paddingBottom: (missing.length && !readOnly ? 58 : 40) + maxRow * ROW_H }}>
      <div style={{ position: 'relative', height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 8px' }}>
        {civilLayer()}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${finished ? posOf(ts(ended) as number) : todayPos}%`, background: 'linear-gradient(90deg,#16a34a,var(--accent))', borderRadius: 2, opacity: 0.55, pointerEvents: 'none' }} />

        {milestones.map(m => {
          const focused = !!focusNoteId && m.noteIds.includes(focusNoteId)
          return (
            <button key={m.noteIds[0]} title={m.title} aria-label={m.title} onClick={() => onRevealNote?.(focusNoteId && m.noteIds.includes(focusNoteId) ? m.noteIds[(m.noteIds.indexOf(focusNoteId) + 1) % m.noteIds.length] : m.noteIds[0])}
              className={`tl-milestone${focused ? ' tl-milestone-focus' : ''}`} style={{ left: `${m.pos}%`, ...milestoneStyle(m) }}>
              {m.kind === 'done' && <i className="ti ti-check" style={{ fontSize: '0.55rem', color: '#fff' }} />}
              {m.noteIds.length > 1 && <span className="tl-milestone-count">{m.noteIds.length}</span>}
            </button>
          )
        })}

        {placed.map(p => {
          const { iso, pos, row } = p
          return (
            <div key={p.field} style={{ position: 'absolute', top: '50%', left: `${pos}%`, transform: 'translate(-50%,-50%)', cursor: readOnly ? 'default' : 'pointer', zIndex: 2 + row }} onClick={() => !readOnly && onStartEdit?.(p.field)}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: p.color, border: '2px solid var(--card-bg)', boxShadow: `0 0 0 1.5px ${p.color}` }} />
              {row > 0 && <div style={{ position: 'absolute', left: '50%', top: 11, height: row * ROW_H + 2, width: 1, background: p.color, opacity: 0.45 }} />}
              <div style={{ position: 'absolute', top: 13 + row * ROW_H, left: 0, transform: pos < 12 ? 'translateX(-8%)' : pos > 88 ? 'translateX(-82%)' : 'translateX(-42%)', fontSize: '0.6rem', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.35, background: row > 0 ? 'var(--card-bg)' : undefined, padding: row > 0 ? '0 2px' : undefined }}>
                <span style={{ display: 'block', color: 'var(--text-muted)' }}>{p.label}</span>
                {editing === p.field && onChangeDate
                  ? <DateInput value={iso} onChange={v => onChangeDate(p.field, v || null)} className="inline-edit-input text-xs" />
                  : <span style={{ display: 'block', fontWeight: 700, color: p.color }}>{fmtShort(iso)}</span>}
              </div>
            </div>
          )
        })}

        {!finished && todayPos > 0 && (
          <div style={{ position: 'absolute', top: '50%', left: `${todayPos}%`, pointerEvents: 'none', zIndex: 3 }}>
            <div style={{ width: 1.5, height: 22, background: 'var(--text-secondary)', position: 'absolute', top: '50%', left: 0, transform: 'translate(-50%,-50%)' }} />
            <div style={{ position: 'absolute', bottom: hasCivil ? 24 : 14, left: '50%', transform: todayPos > 94 ? 'translateX(-85%)' : 'translateX(-50%)', fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>auj.</div>
          </div>
        )}
      </div>

      {missing.length > 0 && !readOnly && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 40, paddingLeft: 8 }}>
          {missing.map(p => editing === p.field && onChangeDate
            ? <DateInput key={p.field} value="" onChange={v => onChangeDate(p.field, v || null)} className="inline-edit-input text-xs" />
            : <button key={p.field} onClick={() => onStartEdit?.(p.field)} className="text-xs t-text-muted rounded px-2 py-0.5" style={{ border: '1px dashed var(--border)' }}>+ {p.label}</button>)}
        </div>
      )}
    </div>
  )
}
