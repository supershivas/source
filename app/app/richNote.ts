// Conversion entre le texte Markdown léger stocké dans `notes.text` et le DOM de l'éditeur visuel.
// Le texte stocké ne change pas de format : « ## titre », « - puce », « [ ] tâche », **gras**, *italique*.

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\*[^*\s][^*\n]*?\*)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inlineToHtml(text: string): string {
  let out = ''
  let rest = text
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) { out += esc(rest); break }
    out += esc(rest.slice(0, m.index))
    const tok = m[0]
    if (m[1]) out += `<code>${esc(tok.slice(1, -1))}</code>`
    else if (m[2]) out += `<b>${inlineToHtml(tok.slice(2, -2))}</b>`
    else if (m[3]) out += `<i>${inlineToHtml(tok.slice(1, -1))}</i>`
    else {
      const close = tok.indexOf('](')
      out += `<a href="${esc(tok.slice(close + 2, -1))}">${esc(tok.slice(1, close))}</a>`
    }
    rest = rest.slice(m.index + tok.length)
  }
  return out
}

export function markdownToHtml(md: string): string {
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null
  const close = () => { if (list) { html.push(`</${list}>`); list = null } }
  for (const line of md.split('\n')) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    const task = /^\[ \]\s?(.*)$/.exec(line)
    if (bullet || numbered) {
      const tag = numbered ? 'ol' : 'ul'
      if (list !== tag) { close(); html.push(`<${tag}>`); list = tag }
      html.push(`<li>${inlineToHtml((bullet || numbered)![1])}</li>`)
      continue
    }
    close()
    if (task) html.push(`<div class="rt-task">${inlineToHtml(task[1]) || '<br>'}</div>`)
    else if (heading) html.push(`<h${heading[1].length}>${inlineToHtml(heading[2]) || '<br>'}</h${heading[1].length}>`)
    else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) html.push('<hr>')
    else html.push(`<div>${inlineToHtml(line) || '<br>'}</div>`)
  }
  close()
  return html.join('')
}

function wrap(marker: string, s: string) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!
  return m[2] ? m[1] + marker + m[2] + marker + m[3] : s
}

function inlineToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/ /g, ' ')
  if (!(node instanceof HTMLElement)) return ''
  if (node.tagName === 'BR') return ''
  const inner = Array.from(node.childNodes).map(inlineToMd).join('')
  const weight = node.style.fontWeight
  const bold = node.tagName === 'B' || node.tagName === 'STRONG' || weight === 'bold' || Number(weight) >= 600
  const italic = node.tagName === 'I' || node.tagName === 'EM' || node.style.fontStyle === 'italic'
  let out = inner
  if (node.tagName === 'CODE') out = '`' + out + '`'
  if (node.tagName === 'A' && node.getAttribute('href')) out = `[${out}](${node.getAttribute('href')})`
  if (bold) out = wrap('**', out)
  if (italic) out = wrap('*', out)
  return out
}

export function domToMarkdown(root: HTMLElement): string {
  const lines: string[] = []
  root.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) { lines.push((node.textContent || '').trim()); return }
    if (!(node instanceof HTMLElement)) return
    const tag = node.tagName
    if (tag === 'UL' || tag === 'OL') {
      node.querySelectorAll(':scope > li').forEach((li, i) => lines.push((tag === 'OL' ? `${i + 1}. ` : '- ') + inlineToMd(li).trim()))
    } else if (/^H[1-3]$/.test(tag)) {
      lines.push('#'.repeat(Number(tag[1])) + ' ' + inlineToMd(node).trim())
    } else if (tag === 'HR') {
      lines.push('---')
    } else if (node.classList.contains('rt-task')) {
      lines.push('[ ] ' + inlineToMd(node).trim())
    } else {
      lines.push(inlineToMd(node).replace(/\s+$/, ''))
    }
  })
  return lines.join('\n').replace(/\s+$/, '')
}
