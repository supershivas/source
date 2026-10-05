'use client'
import { todoItems } from '../todo'

// Cocher une tâche la retire de la liste et l'archive comme note (côté App).
export default function TodoNote({ text, onComplete }: { text: string; onComplete: (index: number) => void }) {
  return (
    <ul className="flex flex-col">
      {todoItems(text).map((item, i) => (
        <li key={i}>
          <button
            onClick={() => onComplete(i)}
            title="Marquer comme fait"
            className="flex items-start gap-2 text-sm text-left w-full py-1"
          >
            <i className="ti ti-square" style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: 1 }} />
            <span className="break-words min-w-0">{item}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
