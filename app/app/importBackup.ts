import type { createClient } from '@/lib/supabase/client'
import type { Project, Subproject } from './types'

type Row = Record<string, unknown>

export interface Backup {
  projects: Row[]
  subprojects: Row[]
  notes: Row[]
}

function omit(row: Row, ...keys: string[]): Row {
  const copy = { ...row }
  for (const k of keys) delete copy[k]
  return copy
}

// Lit un fichier produit par « Exporter mes données » (Réglages) et le met à
// plat, table par table. Lève une erreur lisible si ce n'est pas un export
// de Source.
export function parseBackup(text: string): Backup {
  let data: { app?: string; projects?: Project[] }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.")
  }
  if (data?.app !== 'source' || !Array.isArray(data.projects)) {
    throw new Error("Ce fichier n'est pas un export de Source.")
  }
  const notes = new Map<string, Row>()
  const subprojects: Row[] = []
  for (const p of data.projects) {
    for (const n of p.notes || []) notes.set(n.id, n as unknown as Row)
    for (const s of p.subprojects || []) {
      subprojects.push(omit(s as unknown as Row, 'notes'))
      for (const n of (s as Subproject).notes || []) notes.set(n.id, n as unknown as Row)
    }
  }
  return {
    projects: data.projects.map(p => omit(p as unknown as Row, 'subprojects', 'notes')),
    subprojects,
    notes: [...notes.values()],
  }
}

// Restaure une sauvegarde : chaque ligne est réécrite telle qu'exportée
// (même identifiant), les lignes absentes de la sauvegarde sont conservées.
// Rien n'est supprimé.
export async function restoreBackup(supabase: ReturnType<typeof createClient>, userId: string, backup: Backup) {
  const projects = backup.projects.map(p => ({ ...p, user_id: userId }))
  if (projects.length) {
    const { error } = await supabase.from('projects').upsert(projects, { onConflict: 'id' })
    if (error) throw error
  }
  if (backup.subprojects.length) {
    const { error } = await supabase.from('subprojects').upsert(backup.subprojects, { onConflict: 'id' })
    if (error) throw error
  }
  if (backup.notes.length) {
    const { error } = await supabase.from('notes').upsert(backup.notes, { onConflict: 'id' })
    if (error) throw error
  }
}
