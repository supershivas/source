'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Category, Importance, Note, Project, Status, Subproject } from './types'
import ProjectModal, { ProjectFormValues } from './components/ProjectModal'
import SubprojectModal, { SubprojectFormValues } from './components/SubprojectModal'
import NoteModal, { NoteFormValues } from './components/NoteModal'
import ConfirmModal from './components/ConfirmModal'
import SortableProjectCard from './components/SortableProjectCard'
import FilterBar, { SortMode } from './components/FilterBar'
import Dashboard from './components/Dashboard'
import { STATUS_LABELS, IMPORTANCE_LABELS, toEU } from './constants'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface AppProps {
  initialProjects: Project[]
  userId: string
  userEmail?: string
}

type DeleteTarget =
  | { type: 'project'; id: string }
  | { type: 'subproject'; id: string; parentId: string }
  | { type: 'note'; id: string; projectId: string; subprojectId?: string }

type NoteModalTarget = { projectId: string; subprojectId?: string; note?: Note }
type SubprojectModalTarget = { parentId: string; sub?: Subproject }

export default function App({ initialProjects, userEmail }: AppProps) {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedCat, setSelectedCat] = useState<Category>('pro')
  const [selectedYear, setSelectedYear] = useState<number>(
    initialProjects.find(p => p.cat === 'pro')?.year || new Date().getFullYear()
  )
  const [modalProject, setModalProject] = useState<Project | null | undefined>(undefined)
  const [subModalTarget, setSubModalTarget] = useState<SubprojectModalTarget | null>(null)
  const [noteModalTarget, setNoteModalTarget] = useState<NoteModalTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [filterImportance, setFilterImportance] = useState<Importance | ''>('')
  const [filterEditor, setFilterEditor] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('updated')
  const [showDashboard, setShowDashboard] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const yearsByCat = useMemo(() => {
    const map: Record<Category, number[]> = { pro: [], perso: [] }
    for (const p of projects) {
      if (p.trashed) continue
      if (!map[p.cat].includes(p.year)) map[p.cat].push(p.year)
    }
    map.pro.sort((a, b) => b - a)
    map.perso.sort((a, b) => b - a)
    return map
  }, [projects])

  const editors = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) {
      if (p.cat === selectedCat && p.year === selectedYear && !p.trashed && p.editor) set.add(p.editor.trim())
    }
    return [...set].sort()
  }, [projects, selectedCat, selectedYear])

  const hasActiveFilters = !!(searchQuery || filterStatus || filterImportance || filterEditor)

  const visibleProjects = useMemo(() => {
    let list = projects.filter(
      p => p.cat === selectedCat && p.year === selectedYear && !p.trashed && (showArchived ? p.archived : !p.archived)
    )

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.number.toLowerCase().includes(q) ||
          (p.editor && p.editor.toLowerCase().includes(q)) ||
          (p.client && p.client.toLowerCase().includes(q)) ||
          (p.notes || []).some(n => n.text.toLowerCase().includes(q)) ||
          (p.subprojects || []).some(s => (s.notes || []).some(n => n.text.toLowerCase().includes(q)))
      )
    }
    if (filterStatus) list = list.filter(p => p.status === filterStatus)
    if (filterImportance) list = list.filter(p => p.importance === filterImportance)
    if (filterEditor) list = list.filter(p => p.editor && p.editor.toLowerCase().includes(filterEditor.toLowerCase()))

    list = [...list]
    if (sortMode === 'number') list.sort((a, b) => a.number.localeCompare(b.number))
    else if (sortMode === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortMode === 'progress') list.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    else if (sortMode === 'deadline')
      list.sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    else if (sortMode === 'importance') {
      const order: Record<Importance, number> = { high: 0, medium: 1, low: 2 }
      list.sort((a, b) => order[a.importance] - order[b.importance])
    } else if (sortMode === 'manual') list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    else list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return list
  }, [projects, selectedCat, selectedYear, showArchived, searchQuery, filterStatus, filterImportance, filterEditor, sortMode])

  function exportCSV() {
    const headers = ['Type', 'Numéro', 'Nom', 'Catégorie', 'Statut', '%', 'Importance', 'Éditeur', 'Client(s)', 'Début', 'Deadline', 'Terminé', 'Mis à jour']
    const rows: (string | number)[][] = []
    visibleProjects.forEach(p => {
      rows.push([
        'Projet', p.number, p.name, p.cat, STATUS_LABELS[p.status] || p.status, `${p.progress ?? 0}%`,
        IMPORTANCE_LABELS[p.importance] || p.importance, p.editor || '', p.client || '',
        toEU(p.date), toEU(p.deadline), toEU(p.ended), toEU(p.updated_at),
      ])
      ;(p.subprojects || []).forEach(s => {
        rows.push(['↳ Sous-projet', s.number, s.name, p.cat, STATUS_LABELS[s.status] || s.status, `${s.progress ?? 0}%`, '', '', '', '', '', toEU(s.ended), ''])
      })
    })
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `source_${selectedCat}_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearFilters() {
    setSearchQuery('')
    setFilterStatus('')
    setFilterImportance('')
    setFilterEditor('')
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = visibleProjects.findIndex(p => p.id === active.id)
    const newIndex = visibleProjects.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(visibleProjects, oldIndex, newIndex)

    setSortMode('manual')
    setProjects(ps => {
      const reorderedIds = new Set(reordered.map(p => p.id))
      const others = ps.filter(p => !reorderedIds.has(p.id))
      const updated = reordered.map((p, i) => ({ ...p, sort_order: i }))
      return [...others, ...updated]
    })

    reordered.forEach((p, i) => {
      supabase.from('projects').update({ sort_order: i }).eq('id', p.id).then()
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function selectYear(cat: Category, year: number) {
    setSelectedCat(cat)
    setSelectedYear(year)
    setShowDashboard(false)
    setShowArchived(false)
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }

  // ── Projects ──
  async function handleSaveProject(values: ProjectFormValues) {
    if (modalProject) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', modalProject.id)
        .select()
        .single()
      if (!error && data) updateProject(data.id, data)
    } else {
      const maxSort = projects.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...values, trashed: false, archived: false, sort_order: maxSort + 1 })
        .select()
        .single()
      if (!error && data) {
        setProjects(ps => [...ps, { ...data, subprojects: [], notes: [] }])
        setSelectedCat(values.cat)
        setSelectedYear(values.year)
      }
    }
    setModalProject(undefined)
  }

  async function handleDeleteProject(id: string) {
    const { error } = await supabase.from('projects').update({ trashed: true }).eq('id', id)
    if (!error) updateProject(id, { trashed: true })
    setDeleteTarget(null)
  }

  async function handleArchiveProject(p: Project) {
    const archived = !p.archived
    const { error } = await supabase.from('projects').update({ archived }).eq('id', p.id)
    if (!error) updateProject(p.id, { archived })
  }

  async function handleArchiveSubproject(parentId: string, sub: Subproject) {
    const archived = !sub.archived
    const { error } = await supabase.from('subprojects').update({ archived }).eq('id', sub.id)
    if (!error) {
      setProjects(ps =>
        ps.map(p =>
          p.id === parentId
            ? { ...p, subprojects: (p.subprojects || []).map(s => (s.id === sub.id ? { ...s, archived } : s)) }
            : p
        )
      )
    }
  }

  // ── Subprojects ──
  async function handleSaveSubproject(values: SubprojectFormValues) {
    if (!subModalTarget) return
    const { parentId, sub } = subModalTarget
    if (sub) {
      const { data, error } = await supabase
        .from('subprojects')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', sub.id)
        .select()
        .single()
      if (!error && data) {
        setProjects(ps =>
          ps.map(p =>
            p.id === parentId
              ? { ...p, subprojects: (p.subprojects || []).map(s => (s.id === data.id ? { ...s, ...data } : s)) }
              : p
          )
        )
      }
    } else {
      const { data, error } = await supabase
        .from('subprojects')
        .insert({ ...values, parent_id: parentId, trashed: false, archived: false })
        .select()
        .single()
      if (!error && data) {
        setProjects(ps =>
          ps.map(p => (p.id === parentId ? { ...p, subprojects: [...(p.subprojects || []), { ...data, notes: [] }] } : p))
        )
      }
    }
    setSubModalTarget(null)
  }

  async function handleDeleteSubproject(target: { id: string; parentId: string }) {
    const { error } = await supabase.from('subprojects').delete().eq('id', target.id)
    if (!error) {
      setProjects(ps =>
        ps.map(p =>
          p.id === target.parentId ? { ...p, subprojects: (p.subprojects || []).filter(s => s.id !== target.id) } : p
        )
      )
    }
    setDeleteTarget(null)
  }

  // ── Notes ──
  async function handleSaveNote(values: NoteFormValues) {
    if (!noteModalTarget) return
    const { projectId, subprojectId, note } = noteModalTarget
    if (note) {
      const { data, error } = await supabase
        .from('notes')
        .update({ text: values.text, date: values.date || null })
        .eq('id', note.id)
        .select()
        .single()
      if (!error && data) {
        setProjects(ps =>
          ps.map(p => {
            if (p.id !== projectId) return p
            if (subprojectId) {
              return {
                ...p,
                subprojects: (p.subprojects || []).map(s =>
                  s.id === subprojectId
                    ? { ...s, notes: (s.notes || []).map(n => (n.id === data.id ? data : n)) }
                    : s
                ),
              }
            }
            return { ...p, notes: (p.notes || []).map(n => (n.id === data.id ? data : n)) }
          })
        )
      }
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          text: values.text,
          date: values.date || null,
          project_id: subprojectId ? null : projectId,
          subproject_id: subprojectId || null,
        })
        .select()
        .single()
      if (!error && data) {
        setProjects(ps =>
          ps.map(p => {
            if (p.id !== projectId) return p
            if (subprojectId) {
              return {
                ...p,
                subprojects: (p.subprojects || []).map(s =>
                  s.id === subprojectId ? { ...s, notes: [...(s.notes || []), data] } : s
                ),
              }
            }
            return { ...p, notes: [...(p.notes || []), data] }
          })
        )
      }
    }
    setNoteModalTarget(null)
  }

  async function handleDeleteNote(target: { id: string; projectId: string; subprojectId?: string }) {
    const { error } = await supabase.from('notes').delete().eq('id', target.id)
    if (!error) {
      setProjects(ps =>
        ps.map(p => {
          if (p.id !== target.projectId) return p
          if (target.subprojectId) {
            return {
              ...p,
              subprojects: (p.subprojects || []).map(s =>
                s.id === target.subprojectId ? { ...s, notes: (s.notes || []).filter(n => n.id !== target.id) } : s
              ),
            }
          }
          return { ...p, notes: (p.notes || []).filter(n => n.id !== target.id) }
        })
      )
    }
    setDeleteTarget(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'project') handleDeleteProject(deleteTarget.id)
    else if (deleteTarget.type === 'subproject') handleDeleteSubproject(deleteTarget)
    else handleDeleteNote(deleteTarget)
  }

  return (
    <div id="body" className="flex h-screen overflow-hidden">
      {/* Sidebar — toujours sombre, parité visuelle avec idee/La-fabrique */}
      <aside id="sidebar" className="sidebar-bg flex flex-col shrink-0" style={{ width: 264 }}>
        <div className="flex items-center justify-between px-4 h-[52px] sidebar-border border-b">
          <div className="sidebar-text font-semibold">Source</div>
          <button className="sidebar-icon-btn rounded p-1">
            <i className="ti ti-settings" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={() => setModalProject(null)}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
          >
            Nouveau projet
          </button>
        </div>

        <div className="px-3 pt-3">
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm sidebar-text bg-transparent sidebar-border border outline-none"
          />
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-3">
          {(['pro', 'perso'] as Category[]).map(cat => (
            <div key={cat} className="mb-3">
              <div className="sidebar-text-muted px-2 text-xs uppercase tracking-wide">
                {cat === 'pro' ? 'Pro' : 'Perso'}
              </div>
              {yearsByCat[cat].length === 0 && (
                <div className="sidebar-text-muted px-2 py-1 text-xs">Aucune année</div>
              )}
              {yearsByCat[cat].map(year => {
                const active = selectedCat === cat && selectedYear === year
                return (
                  <button
                    key={`${cat}-${year}`}
                    onClick={() => selectYear(cat, year)}
                    className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-1.5 text-left text-sm ${active ? 'sidebar-selected' : ''}`}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-2 pb-2">
          <button
            onClick={() => {
              setShowDashboard(v => !v)
              setShowArchived(false)
            }}
            className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm ${showDashboard ? 'sidebar-selected' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setShowArchived(v => !v)
              setShowDashboard(false)
            }}
            className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm ${showArchived ? 'sidebar-selected' : ''}`}
          >
            Archivés
          </button>
          <button onClick={exportCSV} className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
            Export CSV
          </button>
          <button className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
            Corbeille
          </button>
        </div>

        <div className="sidebar-border flex items-center justify-between border-t px-3 py-2">
          <span className="sidebar-text-muted text-xs">{userEmail}</span>
          <button onClick={handleLogout} className="sidebar-icon-btn rounded p-1">
            <i className="ti ti-logout" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main" className="flex-1 overflow-y-auto p-6">
        <h1 className="text-lg font-semibold mb-4">
          {selectedCat === 'pro' ? 'Pro' : 'Perso'} · {selectedYear}
          {showDashboard ? ' · Dashboard' : showArchived ? ' · Archivés' : ''}
        </h1>

        {showDashboard ? (
          <Dashboard projects={projects} selectedCat={selectedCat} selectedYear={selectedYear} />
        ) : (
          <>
            <FilterBar
              status={filterStatus}
              importance={filterImportance}
              editor={filterEditor}
              sort={sortMode}
              editors={editors}
              hasActiveFilters={hasActiveFilters}
              onStatusChange={setFilterStatus}
              onImportanceChange={setFilterImportance}
              onEditorChange={setFilterEditor}
              onSortChange={setSortMode}
              onClear={clearFilters}
            />

            {visibleProjects.length === 0 && (
              <p className="t-text-muted text-sm">
                {hasActiveFilters
                  ? 'Aucun résultat pour ce filtre.'
                  : showArchived
                  ? 'Aucun projet archivé.'
                  : 'Aucun projet pour cette année/catégorie.'}
              </p>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {visibleProjects.map(p => (
                    <SortableProjectCard
                      key={p.id}
                      project={p}
                      onEdit={() => setModalProject(p)}
                      onDelete={() => setDeleteTarget({ type: 'project', id: p.id })}
                      onArchive={() => handleArchiveProject(p)}
                      onAddSubproject={() => setSubModalTarget({ parentId: p.id })}
                      onEditSubproject={sub => setSubModalTarget({ parentId: p.id, sub })}
                      onDeleteSubproject={sub => setDeleteTarget({ type: 'subproject', id: sub.id, parentId: p.id })}
                      onArchiveSubproject={sub => handleArchiveSubproject(p.id, sub)}
                      onAddNote={subprojectId => setNoteModalTarget({ projectId: p.id, subprojectId })}
                      onEditNote={(note, subprojectId) => setNoteModalTarget({ projectId: p.id, subprojectId, note })}
                      onDeleteNote={(note, subprojectId) =>
                        setDeleteTarget({ type: 'note', id: note.id, projectId: p.id, subprojectId })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </main>

      {modalProject !== undefined && (
        <ProjectModal
          project={modalProject}
          defaultCat={selectedCat}
          defaultYear={selectedYear}
          onSave={handleSaveProject}
          onClose={() => setModalProject(undefined)}
        />
      )}

      {subModalTarget && (
        <SubprojectModal
          initial={
            subModalTarget.sub
              ? {
                  number: subModalTarget.sub.number,
                  name: subModalTarget.sub.name,
                  status: subModalTarget.sub.status,
                  progress: subModalTarget.sub.progress ?? 0,
                  deadline: subModalTarget.sub.deadline || '',
                }
              : undefined
          }
          parentNumber={projects.find(p => p.id === subModalTarget.parentId)?.number || ''}
          onSave={handleSaveSubproject}
          onClose={() => setSubModalTarget(null)}
        />
      )}

      {noteModalTarget && (
        <NoteModal
          initial={noteModalTarget.note ? { text: noteModalTarget.note.text, date: noteModalTarget.note.date || '' } : undefined}
          onSave={handleSaveNote}
          onClose={() => setNoteModalTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={
            deleteTarget.type === 'project'
              ? 'Supprimer le projet'
              : deleteTarget.type === 'subproject'
              ? 'Supprimer le sous-projet'
              : 'Supprimer la note'
          }
          message={
            deleteTarget.type === 'project'
              ? 'Le projet sera déplacé dans la corbeille.'
              : 'Cette action est définitive.'
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
