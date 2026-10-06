'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { markdownToHtml, domToMarkdown } from '../richNote'

export interface RichNoteEditorHandle { getMarkdown: () => string }

interface Props {
  initial: string
  onChange: (markdown: string) => void
  onSubmit: () => void
}

// Éditeur visuel : on voit le résultat (gras, titres, puces, cases à cocher), jamais les codes.
// Le texte stocké reste du Markdown léger (voir richNote.ts).
const RichNoteEditor = forwardRef<RichNoteEditorHandle, Props>(function RichNoteEditor({ initial, onChange, onSubmit }, ref) {
  const rootRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({ getMarkdown: () => (rootRef.current ? domToMarkdown(rootRef.current) : '') }))

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.innerHTML = markdownToHtml(initial) || '<div><br></div>'
    root.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
    sel?.removeAllRanges(); sel?.addRange(range)
    onChange(domToMarkdown(root))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function emit() { if (rootRef.current) onChange(domToMarkdown(rootRef.current)) }

  // Bloc de premier niveau qui contient le curseur.
  function currentBlock(): HTMLElement | null {
    const root = rootRef.current
    let n: Node | null = window.getSelection()?.anchorNode || null
    while (n && n.parentNode !== root) n = n.parentNode
    return n instanceof HTMLElement ? n : null
  }

  function caretTo(el: Node, atStart = false) {
    const sel = window.getSelection()
    const r = document.createRange()
    r.selectNodeContents(el)
    r.collapse(atStart || (el.childNodes.length === 1 && el.firstChild?.nodeName === 'BR'))
    sel?.removeAllRanges(); sel?.addRange(r)
  }

  function retag(block: HTMLElement, tag: string, cls?: string) {
    const el = document.createElement(tag)
    if (cls) el.className = cls
    while (block.firstChild) el.appendChild(block.firstChild)
    if (!el.textContent) el.replaceChildren(document.createElement('br'))
    block.replaceWith(el)
    caretTo(el)
    return el
  }

  function toggleHeading() {
    const b = currentBlock(); if (!b) return
    if (b.tagName === 'UL' || b.tagName === 'OL') { document.execCommand('insertUnorderedList'); return toggleHeading() }
    if (b.tagName === 'H2') retag(b, 'div'); else retag(b, 'h2')
    emit()
  }

  function toggleBullets() {
    const b = currentBlock(); if (!b) return
    if (b.classList.contains('rt-task')) retag(b, 'div')
    else if (/^H[1-3]$/.test(b.tagName)) retag(b, 'div')
    document.execCommand('insertUnorderedList')
    emit()
  }

  function toggleTask() {
    const b = currentBlock(); if (!b) return
    if (b.tagName === 'UL' || b.tagName === 'OL') { document.execCommand('insertUnorderedList'); return toggleTask() }
    if (b.classList.contains('rt-task')) retag(b, 'div'); else retag(b, 'div', 'rt-task')
    emit()
  }

  function inline(cmd: 'bold' | 'italic') { rootRef.current?.focus(); document.execCommand(cmd); emit() }

  // Saisie façon Markdown : « ## », « - », « [ ] » en début de ligne deviennent titre, puce, tâche.
  function onInput() {
    const b = currentBlock()
    if (b && b.tagName === 'DIV' && !b.classList.contains('rt-task') && b.firstChild?.nodeType === Node.TEXT_NODE) {
      const text = b.firstChild.textContent || ''
      const task = /^\[\s?\]\s/.exec(text)
      const head = /^#{1,3}\s/.exec(text)
      const bullet = /^[-*]\s/.exec(text)
      const strip = (n: number) => { (b.firstChild as Text).textContent = text.slice(n) }
      if (task) { strip(task[0].length); retag(b, 'div', 'rt-task') }
      else if (head) { strip(head[0].length); retag(b, `h${head[0].trim().length}`) }
      else if (bullet) { strip(bullet[0].length); document.execCommand('insertUnorderedList') }
    }
    emit()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit(); return }
    const b = currentBlock()
    const sel = window.getSelection()
    if (!b || !sel?.isCollapsed) return
    if (e.key === 'Enter' && !e.shiftKey && b.classList.contains('rt-task')) {
      e.preventDefault()
      if (!(b.textContent || '').trim()) { retag(b, 'div'); emit(); return }
      const r = sel.getRangeAt(0)
      const tail = document.createRange()
      tail.setStart(r.endContainer, r.endOffset); tail.setEnd(b, b.childNodes.length)
      const next = document.createElement('div')
      next.className = 'rt-task'
      next.appendChild(tail.extractContents())
      if (!next.firstChild || !(next.textContent || '')) { next.innerHTML = '<br>' }
      if (!b.firstChild) b.appendChild(document.createElement('br'))
      b.after(next)
      caretTo(next, true)
      emit()
    }
    if (e.key === 'Backspace' && b.classList.contains('rt-task')) {
      const r = sel.getRangeAt(0)
      const head = document.createRange()
      head.setStart(b, 0); head.setEnd(r.startContainer, r.startOffset)
      if (head.toString() === '') { e.preventDefault(); retag(b, 'div'); emit() }
    }
  }

  const tools = [
    { icon: 'bold', label: 'Gras (Ctrl+B)', run: () => inline('bold') },
    { icon: 'italic', label: 'Italique (Ctrl+I)', run: () => inline('italic') },
    { icon: 'heading', label: 'Titre', run: toggleHeading },
    { icon: 'list', label: 'Liste à puces', run: toggleBullets },
    { icon: 'list-check', label: 'Liste de tâches (cases à cocher)', run: toggleTask },
  ]

  return (
    <>
      <div className="flex gap-1 mb-2">
        {tools.map(t => (
          <button key={t.icon} type="button" title={t.label} aria-label={t.label}
            onMouseDown={e => e.preventDefault()} onClick={t.run}
            className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
            <i className={`ti ti-${t.icon}`} />
          </button>
        ))}
      </div>
      <div
        ref={rootRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Texte de la note"
        data-placeholder="Écrivez ici : le résultat s'affiche en direct"
        className="rt-editor note-md w-full rounded-lg border px-3 py-2 text-sm t-border"
        onInput={onInput}
        onKeyDown={onKeyDown}
        onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
        onBlur={emit}
      />
    </>
  )
})

export default RichNoteEditor
