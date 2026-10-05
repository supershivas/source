// Liste de tâches : une note dont chaque ligne commence par « [ ] ».
// Aucun changement de schéma — le type est porté par le texte de la note.
const PREFIX = '[ ] '

export function isTodoNote(text: string) { return text.startsWith(PREFIX) }

export function todoItems(text: string): string[] {
  return text.split('\n').map(l => l.replace(/^\[ \]\s?/, '').trim()).filter(Boolean)
}

export function serializeTodo(items: string[]): string {
  return items.map(i => PREFIX + i).join('\n')
}

// Saisie libre (une tâche par ligne, puces tolérées) → texte de note.
export function todoTextFromInput(input: string): string {
  return serializeTodo(input.split('\n').map(l => l.replace(/^\s*(\[ \]|[-*•])\s*/, '').trim()).filter(Boolean))
}

export const DONE_PREFIX = 'Fait : '
