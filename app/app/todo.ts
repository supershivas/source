// Tâches : une ligne qui commence par « [ ] », n'importe où dans une note.
// Aucun changement de schéma — le type est porté par le texte de la note.
const PREFIX = '[ ] '
const TODO_LINE = /^\[ \]\s?(.*)$/

export const DONE_PREFIX = 'Fait : '

export function todoLineText(line: string): string | null {
  const m = TODO_LINE.exec(line)
  return m ? m[1].trim() : null
}

export function hasTodo(text: string) { return text.split('\n').some(l => todoLineText(l) !== null) }

// Saisie libre → format stocké : « [] », « [ ] », « - [ ] » et « * [ ] » deviennent « [ ] ».
export function normalizeTodoLines(text: string): string {
  return text.split('\n').map(l => {
    const m = /^\s*(?:[-*•]\s*)?\[\s?\]\s*(.*)$/.exec(l)
    return m ? PREFIX + m[1].trim() : l
  }).join('\n')
}

export function todoPrefix() { return PREFIX }
