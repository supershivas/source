import { Project, Subproject, Note } from './types'
import { STATUS_LABELS, IMPORTANCE_LABELS, toEU } from './constants'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

function notesHtml(notes: Note[]) {
  if (!notes.length) return '<p class="muted">Aucune note.</p>'
  return sortNotes(notes).map(n => {
    const status = n.text.startsWith('→ ')
    return `<div class="note${status ? ' status' : ''}"><div class="text">${esc(status ? `Statut → ${n.text.slice(2)}` : n.text)}</div><div class="date">${fmtDate(n.created_at)}</div></div>`
  }).join('')
}

function metaRow(label: string, value?: string | null) {
  return value ? `<tr><th>${label}</th><td>${esc(value)}</td></tr>` : ''
}

function subHtml(s: Subproject) {
  const meta = [STATUS_LABELS[s.status], s.deadline ? `deadline ${toEU(s.deadline)}` : '', s.ended ? `fin ${toEU(s.ended)}` : ''].filter(Boolean).join(' · ')
  return `<section class="sub"><h3>${s.number ? `<span class="num">${esc(s.number)}</span> ` : ''}${esc(s.name)}</h3><p class="muted">${esc(meta)}</p>${notesHtml(s.notes || [])}</section>`
}

export function printProject(project: Project) {
  const subs = (project.subprojects || []).filter(s => !s.trashed)
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(project.name)}</title><style>
    body { font-family: system-ui, sans-serif; color: #111; margin: 24px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 14px; margin: 0 0 2px; } .num, .muted { color: #666; } .muted { font-size: 12px; margin: 2px 0 6px; }
    table { border-collapse: collapse; margin-top: 8px; } th { text-align: left; font-weight: 500; color: #666; padding: 2px 16px 2px 0; }
    .note { border: 1px solid #ddd; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px; break-inside: avoid; }
    .note .text { white-space: pre-wrap; } .note .date { color: #888; font-size: 11px; } .note.status { background: #f6f6f6; }
    .sub { margin-bottom: 18px; }
  </style></head><body>
    <h1>${project.number ? `<span class="num">${esc(project.number)}</span> ` : ''}${esc(project.name)}</h1>
    <table>
      ${metaRow('Statut', STATUS_LABELS[project.status])}
      ${metaRow('Importance', IMPORTANCE_LABELS[project.importance])}
      ${metaRow('Éditeur', project.editor)}
      ${metaRow('Client', project.client)}
      ${metaRow('Début', project.date ? toEU(project.date) : null)}
      ${metaRow('Deadline', project.deadline ? toEU(project.deadline) : null)}
      ${metaRow('Fin', project.ended ? toEU(project.ended) : null)}
    </table>
    <h2>Notes et historique</h2>${notesHtml(project.notes || [])}
    ${subs.length ? `<h2>Sous-projets</h2>${subs.map(subHtml).join('')}` : ''}
  </body></html>`

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  const win = frame.contentWindow
  if (!doc || !win) { frame.remove(); return }
  doc.open(); doc.write(html); doc.close()
  win.onafterprint = () => frame.remove()
  setTimeout(() => { win.focus(); win.print() }, 100)
}
