'use client'
import { useLayoutEffect, useRef, useState } from 'react'
import NoteMarkdown from './NoteMarkdown'
import { hasTodo } from '../todo'

const CLAMP_LINES = 4

// Texte de note replié à CLAMP_LINES lignes ; le bouton n'apparaît que si le
// texte dépasse réellement (mesuré, donc juste quelle que soit la largeur).
export default function NoteText({ text, onCompleteLine }: { text: string; onCompleteLine?: (line: number) => void }) {
  const clamp = !hasTodo(text)
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded || !clamp) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, expanded, clamp])

  return (
    <>
      <div
        ref={ref}
        className="text-sm break-words note-md"
        style={expanded || !clamp ? undefined : {
          display: '-webkit-box',
          WebkitLineClamp: CLAMP_LINES,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        <NoteMarkdown text={text} onCompleteLine={onCompleteLine} />
      </div>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 text-xs font-medium py-1"
          style={{ color: 'var(--accent)' }}
        >
          {expanded ? 'Réduire' : 'Afficher plus'}
          <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: '0.85rem' }} />
        </button>
      )}
    </>
  )
}
