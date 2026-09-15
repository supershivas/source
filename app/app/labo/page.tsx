'use client'
/**
 * Page labo — terrain d'essai visuel, non connecté à Supabase.
 * Route : /app/labo (protégée par le middleware comme le reste de /app).
 * Objectif : comparer plusieurs façons de différencier les statuts
 * (ongoing / sent to client / on hold) croisés avec les importances.
 * Rien ici n'est utilisé par l'app : on choisit, puis on porte dans ProjectCard.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Importance, Status } from '../types'
import { IMPORTANCE_LABELS, STATUS_LABELS } from '../constants'

/* ─── Données de démo ──────────────────────────────────────────────────────── */
type Demo = { number: string; name: string; status: Status; importance: Importance; editor: string; deadline: string }

const DEMO: Demo[] = [
  { number: '25-014', name: 'Catalogue Rétrospective', status: 'ongoing', importance: 'high', editor: 'Actes Sud', deadline: '12/10/2026' },
  { number: '25-021', name: 'Affiche saison 26', status: 'ongoing', importance: 'low', editor: 'TNB', deadline: '' },
  { number: '25-008', name: 'Identité Festival Nord', status: 'sent', importance: 'high', editor: 'Ville de Lille', deadline: '30/09/2026' },
  { number: '25-033', name: 'Refonte site vitrine', status: 'sent', importance: 'medium', editor: 'Studio Vert', deadline: '' },
  { number: '24-102', name: 'Collection Carnets vol. 3', status: 'hold', importance: 'high', editor: 'Les Carnets', deadline: '05/11/2026' },
  { number: '25-002', name: 'Signalétique musée', status: 'hold', importance: 'low', editor: 'MAC', deadline: '' },
]

/* Couleur « on hold » actuelle = strictement identique à « ready ». */
const HOLD_FIX = { fg: '#8A6A1F', bg: '#F6EFDC', fgDark: '#D9B75C', bgDark: '#2B2513' }

function statusColor(s: Status, fixHold: boolean) {
  if (s === 'hold' && fixHold) return 'var(--labo-hold-fg)'
  return `var(--s-${s}-fg)`
}
function statusBg(s: Status, fixHold: boolean) {
  if (s === 'hold' && fixHold) return 'var(--labo-hold-bg)'
  return `var(--s-${s}-bg)`
}

const IMP_COLOR: Record<Importance, string> = { high: '#C0392B', medium: '#D4A017', low: '#8A8A8A' }
const IMP_WEIGHT: Record<Importance, number> = { high: 3, medium: 2, low: 1 }

/* ─── Briques communes ─────────────────────────────────────────────────────── */
function Shell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="t-bg-card rounded-lg p-3 relative"
      style={{ boxShadow: 'var(--card-shadow)', ...style }}
    >
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

function Meta({ p }: { p: Demo }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
      <span className="tag-chip"><i className="ti ti-building" style={{ fontSize: '0.6rem' }} />{p.editor}</span>
      {p.deadline && <span className="tag-chip">☠ {p.deadline}</span>}
    </div>
  )
}

function Num({ p }: { p: Demo }) {
  return (
    <span className="text-xs t-text-muted shrink-0 whitespace-nowrap" style={{ fontFamily: 'ui-monospace, monospace' }}>
      {p.number}
    </span>
  )
}

function StatusBadge({ s, fixHold }: { s: Status; fixHold: boolean }) {
  return (
    <span
      className="status-badge"
      style={{ fontSize: '0.62rem', padding: '2px 7px', background: statusBg(s, fixHold), color: statusColor(s, fixHold) }}
    >
      {STATUS_LABELS[s]}
    </span>
  )
}

function ImpBadge({ i }: { i: Importance }) {
  return (
    <span className={`imp-tag imp-tag-${i} shrink-0`} style={{ fontSize: '0.62rem', padding: '2px 7px' }}>
      {IMPORTANCE_LABELS[i]}
    </span>
  )
}

/* ─── A — Rail de statut + graduation d'importance ─────────────────────────── */
function CardA({ p, fixHold }: { p: Demo; fixHold: boolean }) {
  const c = statusColor(p.status, fixHold)
  const h = { high: '100%', medium: '55%', low: '22%' }[p.importance]
  return (
    <Shell style={{ overflow: 'hidden', paddingLeft: 18 }}>
      <span
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, display: 'block',
          background: `color-mix(in srgb, ${c} 22%, var(--card-bg))`,
        }}
      >
        <span style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: h, background: c, display: 'block' }} />
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Num p={p} />
          <span className="text-sm font-semibold truncate">{p.name}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge s={p.status} fixHold={fixHold} />
          <Meta p={p} />
        </div>
      </div>
    </Shell>
  )
}

/* ─── B — Pastille de statut + hiérarchie typographique ────────────────────── */
function CardB({ p, fixHold }: { p: Demo; fixHold: boolean }) {
  const c = statusColor(p.status, fixHold)
  const dot =
    p.status === 'hold'
      ? { background: 'transparent', border: `2px solid ${c}` }
      : p.status === 'sent'
        ? { background: c, boxShadow: `0 0 0 3px color-mix(in srgb, ${c} 25%, transparent)` }
        : { background: c }
  return (
    <Shell>
      <span className="shrink-0" style={{ width: 9, height: 9, borderRadius: '50%', display: 'block', ...dot }} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Num p={p} />
          <span
            className="truncate"
            style={{
              fontSize: p.importance === 'high' ? '0.95rem' : '0.875rem',
              fontWeight: p.importance === 'high' ? 700 : p.importance === 'medium' ? 600 : 400,
              color: p.importance === 'low' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {p.name}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs" style={{ color: c, fontWeight: 600 }}>{STATUS_LABELS[p.status]}</span>
          <Meta p={p} />
        </div>
      </div>
    </Shell>
  )
}

/* ─── C — Carte teintée par statut + pastille d'importance ─────────────────── */
function CardC({ p, fixHold }: { p: Demo; fixHold: boolean }) {
  const c = statusColor(p.status, fixHold)
  return (
    <Shell
      style={{
        borderLeft: `3px solid ${c}`,
        background: `color-mix(in srgb, ${c} 7%, var(--card-bg))`,
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Num p={p} />
          <span className="text-sm font-semibold truncate">{p.name}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge s={p.status} fixHold={fixHold} />
          <Meta p={p} />
        </div>
      </div>
      {p.importance !== 'low' && (
        <span
          className="shrink-0"
          title={IMPORTANCE_LABELS[p.importance]}
          style={{ width: 8, height: 8, borderRadius: '50%', background: IMP_COLOR[p.importance], display: 'block' }}
        />
      )}
    </Shell>
  )
}

/* ─── D — États inactifs traités : pause grisée, envoi pointillé ───────────── */
function CardD({ p, fixHold }: { p: Demo; fixHold: boolean }) {
  const c = statusColor(p.status, fixHold)
  const isHold = p.status === 'hold'
  const isSent = p.status === 'sent'
  return (
    <Shell
      style={{
        borderLeft: `3px ${isSent ? 'dashed' : 'solid'} ${c}`,
        opacity: isHold ? 0.62 : 1,
        filter: isHold ? 'saturate(0.35)' : undefined,
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Num p={p} />
          <span className="text-sm font-semibold truncate">{p.name}</span>
          {isHold && <span className="text-xs t-text-muted shrink-0">⏸ en pause</span>}
          {isSent && <span className="text-xs shrink-0" style={{ color: c }}>✈ chez le client</span>}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge s={p.status} fixHold={fixHold} />
          <Meta p={p} />
        </div>
      </div>
      <span className="shrink-0 flex items-center gap-[2px]" title={IMPORTANCE_LABELS[p.importance]}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 3,
              height: 13,
              borderRadius: 2,
              display: 'block',
              background: i < IMP_WEIGHT[p.importance] ? IMP_COLOR[p.importance] : 'var(--border)',
            }}
          />
        ))}
      </span>
    </Shell>
  )
}

/* ─── E — Regroupement par statut (en-têtes) ───────────────────────────────── */
function GroupE({ s, items, fixHold }: { s: Status; items: Demo[]; fixHold: boolean }) {
  const c = statusColor(s, fixHold)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
        <span className="text-xs font-semibold" style={{ color: c }}>{STATUS_LABELS[s]}</span>
        <span className="text-xs t-text-muted">{items.length}</span>
        <span className="flex-1" style={{ height: 1, background: 'var(--border)' }} />
      </div>
      {items.map(p => (
        <Shell key={p.number} style={{ borderLeft: `3px solid ${c}` }}>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <Num p={p} />
              <span className="text-sm font-semibold truncate">{p.name}</span>
            </div>
            <Meta p={p} />
          </div>
          <ImpBadge i={p.importance} />
        </Shell>
      ))}
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function LaboPage() {
  const [dark, setDark] = useState(false)
  const [fixHold, setFixHold] = useState(true)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }

  const holdVars = {
    '--labo-hold-fg': dark ? HOLD_FIX.fgDark : HOLD_FIX.fg,
    '--labo-hold-bg': dark ? HOLD_FIX.bgDark : HOLD_FIX.bg,
  } as React.CSSProperties

  const sections: { key: string; titre: string; pourquoi: string; limite: string; render: () => React.ReactNode }[] = [
    {
      key: 'A',
      titre: 'A — Rail de statut, hauteur = importance',
      pourquoi:
        "La couleur de la barre de gauche dit le statut, sa hauteur remplie dit l'importance. Deux informations dans 6 px, aucun mot en plus, lisible en balayant la colonne.",
      limite: "L'importance devient une nuance : elle se lit en comparant les cartes entre elles, pas isolément.",
      render: () => DEMO.map(p => <CardA key={p.number} p={p} fixHold={fixHold} />),
    },
    {
      key: 'B',
      titre: 'B — Pastille de statut + poids du titre',
      pourquoi:
        "Plus de badge coloré : le statut est une pastille (pleine = en cours, cerclée = en pause, halo = envoyé) et l'importance passe dans la typo du titre. Très calme, très dense.",
      limite: 'Demande un temps d’apprentissage : la forme de la pastille doit être mémorisée.',
      render: () => DEMO.map(p => <CardB key={p.number} p={p} fixHold={fixHold} />),
    },
    {
      key: 'C',
      titre: 'C — Fond de carte teinté par le statut',
      pourquoi:
        "Le statut colore toute la carte (7 % de teinte) : un bloc « en pause » se repère à un mètre. L'importance se réduit à un point, affiché seulement pour high et medium.",
      limite: 'Beaucoup de couleur si la liste mélange six statuts ; à réserver à des listes courtes ou filtrées.',
      render: () => DEMO.map(p => <CardC key={p.number} p={p} fixHold={fixHold} />),
    },
    {
      key: 'D',
      titre: 'D — Traiter les états « hors de mes mains »',
      pourquoi:
        "On hold est grisé et désaturé, sent to client a un liseré pointillé et une mention « chez le client » : ce qui n'attend pas d'action de ta part recule visuellement. L'importance est une jauge de 3 traits.",
      limite: 'Un projet high mis en pause devient discret — c’est le but, mais ça peut se retourner contre toi.',
      render: () => DEMO.map(p => <CardD key={p.number} p={p} fixHold={fixHold} />),
    },
    {
      key: 'E',
      titre: 'E — Regrouper par statut plutôt que colorer',
      pourquoi:
        "Le statut n'est plus un badge répété sur chaque ligne : il devient un en-tête de section avec compteur. Les cartes redeviennent sobres et l'importance reprend toute la place.",
      limite: 'Incompatible avec le tri manuel par glisser-déposer tel qu’il existe aujourd’hui.',
      render: () => (
        <div className="flex flex-col gap-4">
          {(['ongoing', 'sent', 'hold'] as Status[]).map(s => (
            <GroupE key={s} s={s} items={DEMO.filter(p => p.status === s)} fixHold={fixHold} />
          ))}
        </div>
      ),
    },
  ]

  return (
    <div style={{ background: 'var(--app-bg)', minHeight: '100vh', ...holdVars }}>
      <div className="mx-auto px-6 py-8 flex flex-col gap-8" style={{ maxWidth: 820 }}>
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold t-text">Labo — différencier les statuts</h1>
            <span className="flex-1" />
            <button onClick={toggleTheme} className="btn-ghost">
              <i className={`ti ti-${dark ? 'sun' : 'moon'}`} /> {dark ? 'Clair' : 'Sombre'}
            </button>
            <Link href="/app" className="btn-ghost">Retour à l’app</Link>
          </div>
          <p className="text-sm t-text-muted">
            Cinq pistes pour mieux distinguer <strong>on hold</strong>, <strong>sent to client</strong> et{' '}
            <strong>ongoing</strong>, croisés avec les trois importances. Rien n’est branché sur la base : c’est une
            maquette, on choisit ici puis on porte le gagnant dans la vraie carte.
          </p>
        </header>

        {/* Constat */}
        <section className="rounded-lg p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold t-text mb-2">Le vrai problème, d’abord</h2>
          <p className="text-sm t-text-muted mb-3">
            Aujourd’hui <code>on hold</code> et <code>ready to start</code> partagent <em>exactement</em> les mêmes
            couleurs (<code>#F1EFE8 / #5F5E5A</code>). Aucune mise en forme ne rattrapera deux statuts peints à
            l’identique : il faut une teinte propre pour la pause.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="status-badge s-ready">Ready to start</span>
            <span className="status-badge s-hold">On hold (actuel)</span>
            <span className="status-badge" style={{ background: 'var(--labo-hold-bg)', color: 'var(--labo-hold-fg)' }}>
              On hold (proposé)
            </span>
            <label className="text-xs t-text-muted flex items-center gap-2 ml-auto cursor-pointer">
              <input type="checkbox" checked={fixHold} onChange={e => setFixHold(e.target.checked)} />
              Appliquer la teinte « pause » dans les maquettes ci-dessous
            </label>
          </div>
        </section>

        {sections.map(s => (
          <section key={s.key} className="flex flex-col gap-3">
            <h2 className="text-base font-semibold t-text">{s.titre}</h2>
            <p className="text-sm t-text-muted">{s.pourquoi}</p>
            <div className="flex flex-col gap-2">{s.render()}</div>
            <p className="text-xs t-text-muted">
              <strong>Limite :</strong> {s.limite}
            </p>
          </section>
        ))}

        <section className="rounded-lg p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold t-text mb-2">Ma recommandation</h2>
          <p className="text-sm t-text-muted">
            <strong>A + D</strong> : garder le rail de gauche (il existe déjà) en lui donnant l’importance par la
            hauteur, et reculer visuellement les projets qui n’attendent rien de toi (pause grisée, envoi en
            pointillé). C’est le seul couple qui répond aux deux questions d’un coup d’œil : « où en est ce projet ? »
            et « est-ce que ça me concerne maintenant ? » — sans ajouter un seul mot sur la carte.
          </p>
        </section>
      </div>
    </div>
  )
}
