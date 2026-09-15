'use client'
import { useState } from 'react'
import { Project } from '../types'
import { STATUS_ACCENT, STATUS_LABELS } from '../constants'

interface CalendarViewProps {
  projects: Project[]
  onOpenProject: (id: string) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, 1=Mon... we want Monday-first, so shift
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7 // 0=Mon, 6=Sun
}

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAY_NAMES = ['L','M','M','J','V','S','D']

export default function CalendarView({ projects, onOpenProject }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  // Index projects by deadline day
  const byDay: Record<number, Project[]> = {}
  for (const p of projects) {
    if (!p.deadline || p.trashed || p.archived) continue
    const d = new Date(p.deadline)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(p)
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={prev}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="ti ti-chevron-left" style={{ fontSize: '0.85rem' }} />
        </button>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 180, textAlign: 'center' }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={next}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="ti ti-chevron-right" style={{ fontSize: '0.85rem' }} />
        </button>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
          style={{ marginLeft: 8, fontSize: '0.72rem', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          Aujourd'hui
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Day headers */}
        {DAY_NAMES.map((d, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', padding: '8px 0', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - firstDay + 1
          const valid = dayNum >= 1 && dayNum <= daysInMonth
          const projs = valid ? (byDay[dayNum] ?? []) : []

          return (
            <div
              key={i}
              style={{
                background: 'var(--card-bg)',
                minHeight: 80,
                padding: '6px',
                opacity: valid ? 1 : 0.3,
              }}
            >
              {valid && (
                <>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: isToday(dayNum) ? 'var(--accent)' : 'transparent',
                    color: isToday(dayNum) ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: isToday(dayNum) ? 700 : 400,
                    marginBottom: 4,
                  }}>
                    {dayNum}
                  </div>
                  {projs.slice(0, 3).map(p => (
                    <button
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      title={p.name}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        fontSize: '0.62rem', padding: '2px 5px', marginBottom: 2,
                        borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: STATUS_ACCENT[p.status] + '22',
                        color: STATUS_ACCENT[p.status],
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        fontWeight: 500,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                  {projs.length > 3 && (
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', paddingLeft: 5 }}>
                      +{projs.length - 3} autres
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {(['ready','ongoing','review','sent','done','hold'] as const).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[s], display: 'inline-block' }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>— les puces représentent la deadline du projet</span>
      </div>
    </div>
  )
}
