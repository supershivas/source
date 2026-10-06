'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Status, Importance } from '../types'
import { STATUS_ACCENT, STATUS_LABELS, IMPORTANCE_LABELS } from '../constants'

interface Sample { number: string; name: string; status: Status; importance: Importance; editor: string; client: string; deadline?: string; notes: number; progress: number }

const SAMPLES: Sample[] = [
  { number: '2026_2153', name: 'Rome treaties 70 exhibition', status: 'ongoing', importance: 'high', editor: 'Claudia, Nathalie', client: 'GSC', notes: 2, progress: 40 },
  { number: '2026_2061', name: 'Card game', status: 'ongoing', importance: 'medium', editor: 'Marta', client: 'GSC', notes: 16, progress: 40 },
  { number: '2026_2089', name: 'Factsheet - Ukraine', status: 'review', importance: 'high', editor: 'Leszek', client: 'PEC', deadline: '03/07/2026', notes: 12, progress: 70 },
  { number: '2026_2164', name: 'LT Cobranded Logo', status: 'ready', importance: 'medium', editor: 'N/A', client: 'COMM1B', notes: 1, progress: 0 },
  { number: '2026_2010', name: 'Annual report', status: 'done', importance: 'low', editor: 'Jessica', client: 'ART', notes: 7, progress: 100 },
]

const card: React.CSSProperties = { background: 'var(--card-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--radius-md, 8px)' }
const muted: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '0.72rem' }

const Badge = ({ s }: { s: Status }) => <span className={`status-badge s-${s}`} style={{ cursor: 'default' }}>{STATUS_LABELS[s]}</span>
const Imp = ({ i }: { i: Importance }) => <span className={`imp-tag imp-tag-${i}`} style={{ cursor: 'default' }}>{IMPORTANCE_LABELS[i]}</span>
const Num = ({ p }: { p: Sample }) => <span className="font-mono" style={{ ...muted, fontSize: '0.75rem' }}>{p.number}</span>
const Name = ({ p }: { p: Sample }) => <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{p.name}</span>
const Meta = ({ p }: { p: Sample }) => (
  <span style={muted}>
    <i className="ti ti-user" /> {p.editor} · <i className="ti ti-building" /> {p.client}
    {p.deadline && <span style={{ color: 'var(--s-review-fg)' }}> · <i className="ti ti-clock" /> {p.deadline}</span>}
  </span>
)


type Variant = { letter: string; id: string; title: string; text: string; status?: 'actuelle' | 'ancienne'; retained?: boolean; render: () => React.ReactNode }
type Topic = { id: string; group: string; label: string; icon: string; variants: Variant[] }

const row = (p: Sample, extra: React.CSSProperties = {}, content?: React.ReactNode) => (
  <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={{ ...card, ...extra }}>{content}</div>
)
const twoLines = (p: Sample, first: React.ReactNode, second: React.ReactNode) => (
  <div className="flex-1 min-w-0 flex flex-col gap-1"><span className="flex items-center gap-2">{first}</span><span className="flex items-center gap-2">{second}</span></div>
)
const std = (p: Sample) => twoLines(p, <><Num p={p} /><Name p={p} /></>, <><Badge s={p.status} /><Meta p={p} /></>)
const list = (f: (p: Sample) => React.ReactNode) => <div className="flex flex-col gap-2">{SAMPLES.map(f)}</div>


const TOPICS: Topic[] = [
  {
    id: 'cartes', group: 'Liste', label: 'Cartes de la liste', icon: 'layout-list',
    variants: [
      { letter: 'A', id: 'pastille', title: 'Pastille de statut', status: 'actuelle', retained: true,
        text: "Un point coloré devant le numéro remplace le liseré. Le badge devient un texte discret.",
        render: () => list(p => row(p, {}, <>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_ACCENT[p.status], flexShrink: 0 }} />
          <div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Name p={p} /><Num p={p} /></span><span style={muted}>{STATUS_LABELS[p.status]} · <Meta p={p} /></span></div>
          <Imp i={p.importance} /></>)) },
      { letter: 'B', id: 'lisere', title: 'Liseré à gauche', status: 'ancienne',
        text: "Une bande de 3 px à gauche de chaque carte, colorée selon le statut ; le badge répète l'information.",
        render: () => list(p => row(p, { borderLeft: `3px solid ${STATUS_ACCENT[p.status]}` }, <>{std(p)}<Imp i={p.importance} /></>)) },
      { letter: 'C', id: 'fond', title: 'Fond teinté',
        text: "Toute la carte prend une teinte très légère du statut ; aucun liseré, le badge reste.",
        render: () => list(p => row(p, { background: `color-mix(in srgb, ${STATUS_ACCENT[p.status]} 7%, var(--card-bg))` }, <>{std(p)}<Imp i={p.importance} /></>)) },
      { letter: 'D', id: 'haut', title: 'Filet en haut',
        text: "Comme le liseré mais horizontal et plus fin (2 px) : moins de masse à gauche, poignée et case restent alignées.",
        render: () => list(p => row(p, { borderTop: `2px solid ${STATUS_ACCENT[p.status]}` }, <>{std(p)}<Imp i={p.importance} /></>)) },
      { letter: 'E', id: 'progression', title: 'Barre de progression',
        text: "La couleur du statut remplit une fine barre en bas de la carte : elle ajoute l'avancement au lieu de répéter le statut.",
        render: () => list(p => (
          <div key={p.number} style={{ ...card, overflow: 'hidden' }}>
            <div className="flex items-center gap-3 px-4 py-3">{std(p)}<Imp i={p.importance} /></div>
            <div style={{ height: 3, background: 'var(--border)' }}><div style={{ width: `${p.progress}%`, height: '100%', background: STATUS_ACCENT[p.status] }} /></div>
          </div>)) },
      { letter: 'F', id: 'icone', title: 'Icône de statut',
        text: "Une icône Tabler au trait dans un rond teinté : le statut se lit par la forme et pas seulement par la couleur (daltonisme).",
        render: () => list(p => {
          const icon = p.status === 'done' ? 'check' : p.status === 'review' ? 'eye' : p.status === 'ready' ? 'player-play' : 'loader-2'
          return row(p, {}, <>
            <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: '50%', background: `color-mix(in srgb, ${STATUS_ACCENT[p.status]} 14%, transparent)`, color: STATUS_ACCENT[p.status], flexShrink: 0 }}><i className={`ti ti-${icon}`} /></span>
            <div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Name p={p} /><Num p={p} /></span><Meta p={p} /></div>
            <Imp i={p.importance} /></>)
        }) },
      { letter: 'G', id: 'dense', title: 'Liste dense',
        text: "Une ligne par projet, sans carte : plus de projets à l'écran, séparés par des filets.",
        render: () => (
          <div style={card}>
            {SAMPLES.map((p, i) => (
              <div key={p.number} className="flex items-center gap-3 px-4" style={{ minHeight: 44, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[p.status], flexShrink: 0 }} />
                <Num p={p} /><span className="flex-1 min-w-0 truncate"><Name p={p} /></span>
                <span style={muted} className="hidden sm:inline">{p.client}</span><Imp i={p.importance} />
              </div>))}
          </div>) },
      { letter: 'H', id: 'regroupe', title: 'Groupé par statut',
        text: "Des titres de groupe portent la couleur ; les cartes dessous restent neutres.",
        render: () => (
          <div className="flex flex-col gap-3">
            {(['ongoing', 'review', 'ready', 'done'] as Status[]).map(st => (
              <div key={st} className="flex flex-col gap-1.5">
                <h3 className="flex items-center gap-2" style={{ fontSize: '0.78rem', fontWeight: 600, color: STATUS_ACCENT[st] }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[st] }} />{STATUS_LABELS[st]} <span style={muted}>{SAMPLES.filter(p => p.status === st).length}</span>
                </h3>
                {SAMPLES.filter(p => p.status === st).map(p => row(p, {}, <><div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><Meta p={p} /></div><Imp i={p.importance} /></>))}
              </div>))}
          </div>) },
    ],
  },
]
const GROUPS = Array.from(new Set(TOPICS.map(t => t.group)))

// Adresse : #sujet-LETTRE (ex. #cartes-C)
function parseHash(): { topic: number; variant: number } {
  try {
    const [t, l] = window.location.hash.slice(1).split('-')
    const topic = Math.max(0, TOPICS.findIndex(x => x.id === t))
    const variant = Math.max(0, TOPICS[topic].variants.findIndex(v => v.letter === l))
    return { topic, variant }
  } catch { return { topic: 0, variant: 0 } }
}

export default function LaboPage() {
  const [topicIdx, setTopicIdx] = useState(0)
  const [variantIdx, setVariantIdx] = useState(0)
  const touchX = useRef<number | null>(null)
  const topic = TOPICS[topicIdx]
  const variant = topic.variants[variantIdx]
  const groupTopics = TOPICS.map((t, i) => ({ t, i })).filter(x => x.t.group === topic.group)

  useEffect(() => {
    const sync = () => { const h = parseHash(); setTopicIdx(h.topic); setVariantIdx(h.variant) }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const go = useCallback((t: number, v: number) => {
    const n = TOPICS[t].variants.length
    const vv = (v + n) % n
    setTopicIdx(t); setVariantIdx(vv)
    try { window.history.replaceState(null, '', `#${TOPICS[t].id}-${TOPICS[t].variants[vv].letter}`) } catch {}
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(topicIdx, variantIdx + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(topicIdx, variantIdx - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, topicIdx, variantIdx])

  const btn = (active: boolean): React.CSSProperties => ({
    minWidth: 44, minHeight: 44, padding: '0 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    border: '1px solid var(--border)', background: active ? 'var(--text-primary)' : 'transparent', color: active ? 'var(--card-bg)' : 'var(--text-secondary)',
  })
  const letter = (v: Variant, active: boolean): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', position: 'relative',
    background: active ? 'var(--accent)' : 'var(--hover-bg)', color: active ? '#fff' : 'var(--text-secondary)',
  })
  const dot = (v: Variant) => v.retained ? <span aria-label="retenue" style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid var(--accent)' }} /> : null

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <style>{`
        .labo-rail, .labo-chips { display: none; }
        @media (min-width: 769px) { .labo-rail { display: flex; } .labo-vbar { display: none !important; } }
        @media (max-width: 768px) { .labo-chips { display: flex; } }
      `}</style>

      {/* En-tête : même titre que l'app (✦ + Source), mais sur fond d'accent, puis « LABO » en mono */}
      <header style={{ background: 'var(--accent)', color: '#fff', flexShrink: 0 }}>
        <div className="flex items-center gap-3 px-4" style={{ height: 52 }}>
          <a href="/app" className="flex items-center gap-2" style={{ color: '#fff', textDecoration: 'none' }} title="Revenir à l'app">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 24, height: 24, fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)' }}>✦</span>
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>Source</span>
          </a>
          <span className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 4, padding: '3px 8px' }}>
            <i className="ti ti-flask" /> Labo
          </span>
        </div>
        {GROUPS.length > 1 && <nav aria-label="Groupes du labo" className="flex gap-1 overflow-x-auto px-3" style={{ background: 'rgba(0,0,0,0.18)' }}>
          {GROUPS.map(g => {
            const active = g === topic.group
            return (
              <button key={g} onClick={() => go(TOPICS.findIndex(t => t.group === g), 0)} aria-current={active} className="shrink-0"
                style={{ minHeight: 44, padding: '0 14px', fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: '#fff', opacity: active ? 1 : 0.7, borderBottom: `3px solid ${active ? '#fff' : 'transparent'}`, background: 'transparent', cursor: 'pointer' }}>
                {g}
              </button>
            )
          })}
        </nav>}
      </header>

      {/* Mobile : sujets du groupe en puces */}
      {groupTopics.length > 1 && <nav className="labo-chips gap-1 overflow-x-auto px-3 py-2" aria-label="Sujets" style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {groupTopics.map(({ t, i }) => (
          <button key={t.id} onClick={() => go(i, 0)} className="shrink-0 flex items-center gap-1.5" style={btn(i === topicIdx)}><i className={`ti ti-${t.icon}`} /> {t.label}</button>
        ))}
      </nav>}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Bureau : sujets du groupe dans la marge, le sujet ouvert déplie ses variantes */}
        <aside className="labo-rail" aria-label="Sujets et variantes" style={{ width: 260, flexShrink: 0, flexDirection: 'column', overflowY: 'auto', background: 'var(--card-bg)', borderRight: '1px solid var(--border)', padding: '12px 8px' }}>
          {groupTopics.map(({ t, i }) => {
            const open = i === topicIdx
            return (
              <div key={t.id} style={{ marginBottom: 4 }}>
                <button onClick={() => go(i, 0)} aria-expanded={open} className="flex items-center gap-2 w-full text-left"
                  style={{ minHeight: 40, padding: '0 10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: open ? 'var(--text-primary)' : 'var(--text-secondary)', background: open ? 'var(--hover-bg)' : 'transparent', cursor: 'pointer' }}>
                  <i className={`ti ti-${t.icon}`} style={{ color: open ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span className="flex-1">{t.label}</span>
                  <span style={muted}>{t.variants.length}</span>
                  <i className={`ti ti-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} />
                </button>
                {open && (
                  <div className="flex flex-col" style={{ marginLeft: 14, paddingLeft: 8, borderLeft: '1px solid var(--border)', marginTop: 2 }}>
                    {t.variants.map((v, vi) => (
                      <button key={v.letter} onClick={() => go(i, vi)} aria-current={vi === variantIdx} className="flex items-center gap-2 text-left"
                        style={{ minHeight: 40, padding: '0 8px', borderRadius: 8, fontSize: '0.82rem', color: vi === variantIdx ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: vi === variantIdx ? 600 : 400, background: vi === variantIdx ? 'var(--hover-bg)' : 'transparent', cursor: 'pointer' }}>
                        <span style={letter(v, vi === variantIdx)}>{v.letter}{dot(v)}</span>
                        <span className="flex-1 truncate">{v.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        <main
          style={{ flex: 1, overflowY: 'auto', touchAction: 'pan-y' }}
          onTouchStart={e => { touchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchX.current == null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 70) go(topicIdx, variantIdx + (dx < 0 ? 1 : -1))
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 24px' }}>
            <p style={{ ...muted, marginBottom: 4 }}>{topic.group} / {topic.label}</p>
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{variant.letter}. {variant.title}</h1>
              {variant.status === 'actuelle' && <span style={{ ...muted, border: '1px solid var(--border)', borderRadius: 10, padding: '1px 8px' }}>actuelle</span>}
              {variant.status === 'ancienne' && <span style={{ ...muted, border: '1px solid var(--border)', borderRadius: 10, padding: '1px 8px' }}>ancienne</span>}
              {variant.retained && <span style={{ fontSize: '0.72rem', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 10, padding: '1px 8px' }}>retenue</span>}
            </div>
            <p style={{ ...muted, fontSize: '0.82rem', marginBottom: 16 }}>{variant.text}</p>
            {variant.render()}
            <p style={{ ...muted, marginTop: 20 }}>Données d'exemple, rien n'est enregistré. Flèches du clavier ou balayage pour changer de variante.</p>
          </div>
        </main>
      </div>

      {/* Mobile : variantes en bas, avec le titre de la variante ouverte */}
      <div className="labo-vbar" style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', paddingTop: 6, flexShrink: 0 }}>
        <p className="truncate px-4" style={{ ...muted, textAlign: 'center', marginBottom: 4 }}>{variant.letter} · {variant.title}</p>
        <div className="flex items-center gap-1 px-3">
          <button onClick={() => go(topicIdx, variantIdx - 1)} aria-label="Variante précédente" style={btn(false)}><i className="ti ti-chevron-left" /></button>
          <div className="flex flex-1 gap-1 overflow-x-auto" style={{ justifyContent: "safe center" }} role="tablist" aria-label="Variantes">
            {topic.variants.map((v, i) => (
              <button key={v.letter} role="tab" aria-selected={i === variantIdx} onClick={() => go(topicIdx, i)} title={v.title} style={{ ...btn(i === variantIdx), position: 'relative', background: i === variantIdx ? 'var(--accent)' : 'transparent', color: i === variantIdx ? '#fff' : 'var(--text-secondary)' }}>
                {v.letter}{dot(v)}
              </button>
            ))}
          </div>
          <button onClick={() => go(topicIdx, variantIdx + 1)} aria-label="Variante suivante" style={btn(false)}><i className="ti ti-chevron-right" /></button>
        </div>
      </div>
    </div>
  )
}
