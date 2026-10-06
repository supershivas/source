'use client'
import { useEffect, useRef, useState } from 'react'
import RichNoteEditor, { RichNoteEditorHandle } from './RichNoteEditor'
import { normalizeTodoLines, todoPrefix } from '../todo'

export interface NoteFormValues {
  text: string
}

interface NoteModalProps {
  initial?: NoteFormValues
  todo?: boolean
  onSave: (values: NoteFormValues) => Promise<void>
  onClose: () => void
}

export default function NoteModal({ initial, todo, onSave, onClose }: NoteModalProps) {
  const [text, setText] = useState(initial ? initial.text : todo ? todoPrefix() : '')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<RichNoteEditorHandle>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !e.shiftKey && !(e.target as HTMLElement)?.isContentEditable) {
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
    await onSave({ text: normalizeTodoLines(editorRef.current?.getMarkdown() ?? text) })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Modifier la note' : 'Nouvelle note détaillée'}</h2>
        <RichNoteEditor ref={editorRef} initial={text} onChange={setText} onSubmit={handleSubmit} />
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
