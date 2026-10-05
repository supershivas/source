import React from 'react'

// Rendu Markdown minimal pour les notes (titres, gras, italique, code, listes,
// liens). Produit des éléments React, jamais de HTML brut : pas d'injection.

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\*[^*\s][^*\n]*?\*)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let rest = text
  let i = 0
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) { out.push(rest); break }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const tok = m[0]
    const key = `${keyPrefix}-${i++}`
    if (m[1]) out.push(<code key={key}>{tok.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={key}>{renderInline(tok.slice(2, -2), key)}</strong>)
    else if (m[3]) out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>)
    else {
      const close = tok.indexOf('](')
      out.push(
        <a key={key} href={tok.slice(close + 2, -1)} target="_blank" rel="noopener noreferrer">
          {tok.slice(1, close)}
        </a>
      )
    }
    rest = rest.slice(m.index + tok.length)
  }
  return out
}

export default function NoteMarkdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  function flushList() {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    const k = `l${blocks.length}`
    blocks.push(<Tag key={k}>{list.items.map((it, j) => <li key={j}>{renderInline(it, `${k}-${j}`)}</li>)}</Tag>)
    list = null
  }

  text.split('\n').forEach((line, idx) => {
    const k = `b${idx}`
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (bullet || numbered) {
      const ordered = !!numbered
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push((bullet || numbered)![1])
      return
    }
    flushList()
    if (heading) {
      const level = heading[1].length
      blocks.push(<div key={k} className={`note-h note-h${level}`}>{renderInline(heading[2], k)}</div>)
    } else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={k} />)
    } else if (!line.trim()) {
      blocks.push(<div key={k} className="note-gap" />)
    } else {
      blocks.push(<div key={k}>{renderInline(line, k)}</div>)
    }
  })
  flushList()
  return <>{blocks}</>
}
