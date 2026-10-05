'use client'
import { useEffect, useRef, useState } from 'react'

export interface NoteFormValues {
  text: string
}

interface NoteModalProps {
  initial?: NoteFormValues
  onSave: (values: NoteFormValues) => Promise<void>
  onClose: () => void
}

export default function NoteModal({ initial, onSave, onClose }: NoteModalProps) {
  const [text, setText] = useState(initial?.text || '')
  const [saving, setSaving] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleSubmit() {
    if (!text.trim() || saving) return
    setSaving(true)
    await onSave({ text })
    setSaving(false)
  }

  // Entoure la sélection de marqueurs Markdown (gras, italique) ou préfixe les lignes (titre, liste).
  function format(kind: 'bold' | 'italic' | 'heading' | 'list') {
    const el = areaRef.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    let next: string
    let caret: [number, number]
    if (kind === 'bold' || kind === 'italic') {
      const m = kind === 'bold' ? '**' : '*'
      next = text.slice(0, a) + m + text.slice(a, b) + m + text.slice(b)
      caret = [a + m.length, b + m.length]
    } else {
      const prefix = kind === 'heading' ? '## ' : '- '
      const start = text.lastIndexOf('\n', a - 1) + 1
      const block = text.slice(start, b).split('\n').map(l => prefix + l).join('\n')
      next = text.slice(0, start) + block + text.slice(b)
      caret = [a + prefix.length, start + block.length]
    }
    setText(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret[0], caret[1]) })
  }

  const tools = [
    { kind: 'bold', icon: 'bold', label: 'Gras (Ctrl+B)' },
    { kind: 'italic', icon: 'italic', label: 'Italique (Ctrl+I)' },
    { kind: 'heading', icon: 'heading', label: 'Titre' },
    { kind: 'list', icon: 'list', label: 'Liste à puces' },
  ] as const

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Modifier la note' : 'Nouvelle note'}</h2>
        <div className="flex gap-1 mb-2">
          {tools.map(t => (
            <button key={t.kind} type="button" title={t.label} aria-label={t.label} onClick={() => format(t.kind)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
              <i className={`ti ti-${t.icon}`} />
            </button>
          ))}
        </div>
        <textarea
          ref={areaRef}
          autoFocus
          rows={10}
          className="w-full rounded-lg border px-3 py-2 text-sm t-border"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); format('bold') }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); format('italic') }
          }}
        />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !text.trim()} className="btn-primary disabled:opacity-50">
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
