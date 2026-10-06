'use client'
import React from 'react'
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

const SECTIONS = [
  { id: 'actuel', label: 'Actuel' },
  { id: 'pastille', label: 'Pastille' },
  { id: 'fond', label: 'Fond teinté' },
  { id: 'haut', label: 'Filet en haut' },
  { id: 'progression', label: 'Progression' },
  { id: 'icone', label: 'Icône de statut' },
  { id: 'dense', label: 'Liste dense' },
  { id: 'regroupe', label: 'Groupé par statut' },
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

function Section({ id, title, text, children }: { id: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 72, marginBottom: 40 }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>{title}</h2>
      <p style={{ ...muted, fontSize: '0.8rem', marginBottom: 12 }}>{text}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

export default function LaboPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-4" style={{ height: 52 }}>
          <a href="/app" className="font-semibold" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Source</a>
          <span style={muted}>/ Labo</span>
        </div>
        <nav aria-label="Rubriques du labo" className="flex gap-1 overflow-x-auto px-3 pb-2">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-md" style={{ fontSize: '0.78rem', padding: '6px 10px', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>{s.label}</a>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 80px' }}>
        <p style={{ ...muted, fontSize: '0.85rem', marginBottom: 28 }}>
          Variantes de mise en page de la liste des projets, avec des données d'exemple. Rien n'est enregistré : c'est un banc d'essai pour comparer, pas une fonctionnalité.
        </p>

        <Section id="actuel" title="Actuel : liseré à gauche" text="Une bande de 3 px à gauche de chaque carte, colorée selon le statut. Le statut est dit trois fois : liseré, badge, et ici la couleur.">
          {SAMPLES.map(p => (
            <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={{ ...card, borderLeft: `3px solid ${STATUS_ACCENT[p.status]}` }}>
              <div className="flex-1 min-w-0 flex flex-col gap-1"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><span className="flex items-center gap-2"><Badge s={p.status} /><Meta p={p} /></span></div>
              <Imp i={p.importance} />
            </div>
          ))}
        </Section>

        <Section id="pastille" title="Pastille de statut" text="Un point coloré devant le nom remplace le liseré. Le badge n'est plus nécessaire : le libellé passe en texte discret.">
          {SAMPLES.map(p => (
            <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={card}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_ACCENT[p.status], flexShrink: 0 }} />
              <div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Name p={p} /><Num p={p} /></span><span style={muted}>{STATUS_LABELS[p.status]} · <Meta p={p} /></span></div>
              <Imp i={p.importance} />
            </div>
          ))}
        </Section>

        <Section id="fond" title="Fond teinté" text="Toute la carte prend une teinte très légère du statut ; aucun liseré, le badge reste.">
          {SAMPLES.map(p => (
            <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={{ ...card, background: `color-mix(in srgb, ${STATUS_ACCENT[p.status]} 7%, var(--card-bg))` }}>
              <div className="flex-1 min-w-0 flex flex-col gap-1"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><span className="flex items-center gap-2"><Badge s={p.status} /><Meta p={p} /></span></div>
              <Imp i={p.importance} />
            </div>
          ))}
        </Section>

        <Section id="haut" title="Filet en haut" text="Même idée que le liseré, mais horizontale et plus fine (2 px) : moins de masse visuelle à gauche, la poignée et la case restent alignées.">
          {SAMPLES.map(p => (
            <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={{ ...card, borderTop: `2px solid ${STATUS_ACCENT[p.status]}` }}>
              <div className="flex-1 min-w-0 flex flex-col gap-1"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><span className="flex items-center gap-2"><Badge s={p.status} /><Meta p={p} /></span></div>
              <Imp i={p.importance} />
            </div>
          ))}
        </Section>

        <Section id="progression" title="Barre de progression" text="La couleur du statut sert à remplir une fine barre en bas de la carte : elle ajoute une information (l'avancement) au lieu de répéter le statut.">
          {SAMPLES.map(p => (
            <div key={p.number} style={{ ...card, overflow: 'hidden' }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0 flex flex-col gap-1"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><span className="flex items-center gap-2"><Badge s={p.status} /><Meta p={p} /></span></div>
                <Imp i={p.importance} />
              </div>
              <div style={{ height: 3, background: 'var(--border)' }}><div style={{ width: `${p.progress}%`, height: '100%', background: STATUS_ACCENT[p.status] }} /></div>
            </div>
          ))}
        </Section>

        <Section id="icone" title="Icône de statut" text="Une icône Tabler au trait dans un rond teinté, à gauche, signale le statut par sa forme et pas seulement par sa couleur (utile en daltonisme).">
          {SAMPLES.map(p => {
            const icon = p.status === 'done' ? 'check' : p.status === 'review' ? 'eye' : p.status === 'ready' ? 'player-play' : 'loader-2'
            return (
              <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={card}>
                <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: '50%', background: `color-mix(in srgb, ${STATUS_ACCENT[p.status]} 14%, transparent)`, color: STATUS_ACCENT[p.status], flexShrink: 0 }}><i className={`ti ti-${icon}`} /></span>
                <div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Name p={p} /><Num p={p} /></span><Meta p={p} /></div>
                <Imp i={p.importance} />
              </div>
            )
          })}
        </Section>

        <Section id="dense" title="Liste dense" text="Une ligne par projet, sans carte : plus de projets à l'écran, séparés par des filets. La couleur se limite à une pastille.">
          <div style={card}>
            {SAMPLES.map((p, i) => (
              <div key={p.number} className="flex items-center gap-3 px-4" style={{ minHeight: 44, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[p.status], flexShrink: 0 }} />
                <Num p={p} />
                <span className="flex-1 min-w-0 truncate"><Name p={p} /></span>
                <span style={muted} className="hidden sm:inline">{p.client}</span>
                <Imp i={p.importance} />
              </div>
            ))}
          </div>
        </Section>

        <Section id="regroupe" title="Groupé par statut" text="Des titres de groupe portent la couleur ; les cartes en dessous restent neutres, sans liseré ni badge.">
          {(['ongoing', 'review', 'ready', 'done'] as Status[]).map(st => (
            <div key={st} className="flex flex-col gap-1.5" style={{ marginBottom: 10 }}>
              <h3 className="flex items-center gap-2" style={{ fontSize: '0.78rem', fontWeight: 600, color: STATUS_ACCENT[st] }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_ACCENT[st] }} />{STATUS_LABELS[st]} <span style={muted}>{SAMPLES.filter(p => p.status === st).length}</span>
              </h3>
              {SAMPLES.filter(p => p.status === st).map(p => (
                <div key={p.number} className="flex items-center gap-3 px-4 py-3" style={card}>
                  <div className="flex-1 min-w-0 flex flex-col"><span className="flex items-center gap-2"><Num p={p} /><Name p={p} /></span><Meta p={p} /></div>
                  <Imp i={p.importance} />
                </div>
              ))}
            </div>
          ))}
        </Section>
      </main>
    </div>
  )
}
