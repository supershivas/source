'use client'
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react'
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
import TrashView from './components/TrashView'
import SettingsModal, { useSettingsPrefs } from './components/SettingsModal'
import YearModal from './components/YearModal'
import ToastStack, { Toast } from './components/ToastStack'
import { STATUS_LABELS, IMPORTANCE_LABELS, AUTO_PROGRESS, toEU } from './constants'
import DetailPanel from './components/DetailPanel'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface AppProps {
  initialProjects: Project[]
  userId: string
  userEmail?: string
}

type DeleteTarget =
  | { type: 'project'; id: string }
  | { type: 'project-permanent'; id: string }
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
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sidebarW, setSidebarW] = useState(264)

  useEffect(() => {
    const stored = Number(localStorage.getItem('source-sidebar-w'))
    if (stored && stored >= 200 && stored <= 420) setSidebarW(stored)
  }, [])

  function startSidebarResize(e: ReactMouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarW
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    function onMove(ev: MouseEvent) {
      const w = Math.min(420, Math.max(200, startW + (ev.clientX - startX)))
      setSidebarW(w)
    }
    function onUp() {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setSidebarW(w => {
        localStorage.setItem('source-sidebar-w', String(w))
        return w
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function showToast(message: string, type: Toast['type'] = 'success') {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2800)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [filterImportance, setFilterImportance] = useState<Importance | ''>('')
  const [filterEditor, setFilterEditor] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('updated')

  useEffect(() => {
    setSearchQuery(localStorage.getItem('source-filter-search') || '')
    setFilterStatus((localStorage.getItem('source-filter-status') as Status | '') || '')
    setFilterImportance((localStorage.getItem('source-filter-imp') as Importance | '') || '')
    setFilterEditor(localStorage.getItem('source-filter-editor') || '')
    setSortMode((localStorage.getItem('source-sort') as SortMode) || 'updated')
  }, [])

  useEffect(() => { localStorage.setItem('source-filter-search', searchQuery) }, [searchQuery])
  useEffect(() => { localStorage.setItem('source-filter-status', filterStatus) }, [filterStatus])
  useEffect(() => { localStorage.setItem('source-filter-imp', filterImportance) }, [filterImportance])
  useEffect(() => { localStorage.setItem('source-filter-editor', filterEditor) }, [filterEditor])
  useEffect(() => { localStorage.setItem('source-sort', sortMode) }, [sortMode])
  const [showDashboard, setShowDashboard] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { prefs, setPrefs } = useSettingsPrefs()

  const [extraYears, setExtraYears] = useState<Record<Category, number[]>>({ pro: [], perso: [] })
  const [yearModalCat, setYearModalCat] = useState<Category | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('source-extra-years')
    if (stored) {
      try {
        setExtraYears(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const yearsByCat = useMemo(() => {
    const map: Record<Category, number[]> = { pro: [], perso: [] }
    for (const p of projects) {
      if (p.trashed) continue
      if (!map[p.cat].includes(p.year)) map[p.cat].push(p.year)
    }
    for (const cat of ['pro', 'perso'] as Category[]) {
      for (const y of extraYears[cat]) if (!map[cat].includes(y)) map[cat].push(y)
    }
    map.pro.sort((a, b) => b - a)
    map.perso.sort((a, b) => b - a)
    return map
  }, [projects, extraYears])

  function addYear(cat: Category, year: number) {
    setExtraYears(prev => {
      const next = { ...prev, [cat]: prev[cat].includes(year) ? prev[cat] : [...prev[cat], year] }
      localStorage.setItem('source-extra-years', JSON.stringify(next))
      return next
    })
    selectYear(cat, year)
    setYearModalCat(null)
  }

  const editors = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) {
      if (p.cat === selectedCat && p.year === selectedYear && !p.trashed && p.editor) set.add(p.editor.trim())
    }
    return [...set].sort()
  }, [projects, selectedCat, selectedYear])

  const allEditors = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) if (!p.trashed && p.editor) set.add(p.editor.trim())
    return [...set].sort()
  }, [projects])

  const allClients = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) if (!p.trashed && p.client) set.add(p.client.trim())
    return [...set].sort()
  }, [projects])

  const hasActiveFilters = !!(searchQuery || filterStatus || filterImportance || filterEditor)

  const trashedProjects = useMemo(() => projects.filter(p => p.trashed), [projects])

  const selectedDetailProject = useMemo(
    () => projects.find(p => p.id === selectedDetailId) || null,
    [projects, selectedDetailId]
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      if (e.key === 'Escape' && selectedDetailId) {
        setSelectedDetailId(null)
        return
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setModalProject(null)
      } else if (e.key === 'd' || e.key === 'D') {
        setShowDashboard(v => !v)
        setShowTrash(false)
      } else if (e.key === 'p' || e.key === 'P') {
        setShowSettings(true)
      } else if (e.key === 'e' || e.key === 'E') {
        exportCSV()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [exportCSV, selectedDetailId])

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
    showToast('Export CSV ✓')
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
    setShowTrash(false)
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
      if (!error && data) {
        updateProject(data.id, data)
        showToast('Projet mis à jour ✓')
      } else if (error) showToast('Erreur lors de la mise à jour', 'error')
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
        showToast('Projet créé ✓')
      } else if (error) showToast('Erreur lors de la création', 'error')
    }
    setModalProject(undefined)
  }

  async function handleDeleteProject(id: string) {
    const { error } = await supabase.from('projects').update({ trashed: true }).eq('id', id)
    if (!error) {
      updateProject(id, { trashed: true })
      showToast('Projet déplacé dans la corbeille')
      setSelectedDetailId(prev => (prev === id ? null : prev))
    }
    setDeleteTarget(null)
  }

  async function handleArchiveProject(p: Project) {
    const archived = !p.archived
    const { error } = await supabase.from('projects').update({ archived }).eq('id', p.id)
    if (!error) {
      updateProject(p.id, { archived })
      showToast(archived ? 'Projet archivé' : 'Projet désarchivé')
    }
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
      showToast(archived ? 'Sous-projet archivé' : 'Sous-projet restauré')
    }
  }

  async function handleChangeStatus(p: Project, status: Status) {
    const progress = AUTO_PROGRESS[status]
    const patch: Partial<Project> = progress == null ? { status } : { status, progress }
    const { error } = await supabase.from('projects').update(patch).eq('id', p.id)
    if (!error) {
      updateProject(p.id, patch)
      showToast('Statut mis à jour ✓')
    }
  }

  async function handleChangeImportance(p: Project, importance: Importance) {
    const { error } = await supabase.from('projects').update({ importance }).eq('id', p.id)
    if (!error) {
      updateProject(p.id, { importance })
      showToast('Priorité mise à jour ✓')
    }
  }

  function handleCopyNumber(number: string) {
    navigator.clipboard.writeText(number)
    showToast('Numéro copié ✓')
  }

  async function handleChangeSubStatus(parentId: string, sub: Subproject, status: Status) {
    const progress = AUTO_PROGRESS[status]
    const patch: Partial<Subproject> = progress == null ? { status } : { status, progress }
    const { error } = await supabase.from('subprojects').update(patch).eq('id', sub.id)
    if (!error) {
      setProjects(ps =>
        ps.map(p =>
          p.id === parentId
            ? { ...p, subprojects: (p.subprojects || []).map(s => (s.id === sub.id ? { ...s, ...patch } : s)) }
            : p
        )
      )
      showToast('Statut mis à jour ✓')
    }
  }

  function handleReorderSubprojects(parentId: string, reordered: Subproject[]) {
    setProjects(ps => ps.map(p => (p.id === parentId ? { ...p, subprojects: reordered } : p)))
  }

  async function handleDuplicateProject(p: Project) {
    const maxSort = projects.reduce((m, pr) => Math.max(m, pr.sort_order || 0), 0)
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        number: `${p.number}_copie`,
        name: `${p.name} (copie)`,
        cat: p.cat,
        year: p.year,
        status: p.status,
        progress: p.progress,
        importance: p.importance,
        editor: p.editor,
        client: p.client,
        date: p.date,
        deadline: p.deadline,
        ended: null,
        archived: false,
        trashed: false,
        sort_order: maxSort + 1,
      })
      .select()
      .single()
    if (error || !newProject) return

    const newSubprojects: Subproject[] = []
    for (const s of p.subprojects || []) {
      const { data: newSub } = await supabase
        .from('subprojects')
        .insert({
          parent_id: newProject.id,
          number: s.number,
          name: s.name,
          status: s.status,
          progress: s.progress,
          archived: false,
          trashed: false,
        })
        .select()
        .single()
      if (newSub) newSubprojects.push({ ...newSub, notes: [] })
    }

    const newNotes: Note[] = []
    for (const n of p.notes || []) {
      const { data: newNote } = await supabase
        .from('notes')
        .insert({ text: n.text, date: n.date, project_id: newProject.id })
        .select()
        .single()
      if (newNote) newNotes.push(newNote)
    }

    setProjects(ps => [...ps, { ...newProject, subprojects: newSubprojects, notes: newNotes }])
    showToast(`Projet dupliqué ✓ (${newSubprojects.length} sous-projet${newSubprojects.length > 1 ? 's' : ''})`)
  }

  async function handleDuplicateSubproject(parentId: string, sub: Subproject) {
    const { data: newSub, error } = await supabase
      .from('subprojects')
      .insert({
        parent_id: parentId,
        number: `${sub.number}b`,
        name: `${sub.name} (copie)`,
        status: sub.status,
        progress: sub.progress,
        archived: false,
        trashed: false,
      })
      .select()
      .single()
    if (error || !newSub) return
    setProjects(ps =>
      ps.map(p =>
        p.id === parentId ? { ...p, subprojects: [...(p.subprojects || []), { ...newSub, notes: [] }] } : p
      )
    )
    showToast('Sous-projet dupliqué ✓')
  }

  async function handleRestoreProject(id: string) {
    const { error } = await supabase.from('projects').update({ trashed: false }).eq('id', id)
    if (!error) {
      updateProject(id, { trashed: false })
      showToast('Projet restauré')
    }
  }

  async function handleDeleteProjectForever(id: string) {
    await supabase.from('subprojects').delete().eq('parent_id', id)
    await supabase.from('notes').delete().eq('project_id', id)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      setProjects(ps => ps.filter(p => p.id !== id))
      showToast('Projet supprimé définitivement')
      setSelectedDetailId(prev => (prev === id ? null : prev))
    }
    setDeleteTarget(null)
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
        showToast('Sous-projet mis à jour ✓')
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
        showToast('Sous-projet créé ✓')
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
      showToast('Sous-projet supprimé')
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
        showToast('Note mise à jour ✓')
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
        showToast('Note ajoutée ✓')
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
      showToast('Note supprimée')
    }
    setDeleteTarget(null)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'project') handleDeleteProject(deleteTarget.id)
    else if (deleteTarget.type === 'project-permanent') handleDeleteProjectForever(deleteTarget.id)
    else if (deleteTarget.type === 'subproject') handleDeleteSubproject(deleteTarget)
    else handleDeleteNote(deleteTarget)
  }

  return (
    <div id="body" className="flex h-screen overflow-hidden">
      {/* Sidebar — toujours sombre, parité visuelle avec idee/La-fabrique */}
      <aside
        id="sidebar"
        className="sidebar-bg flex flex-col shrink-0 relative"
        style={{ width: sidebarW, minWidth: 200, maxWidth: 420 }}
      >
        <div
          onMouseDown={startSidebarResize}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-[var(--accent)] hover:opacity-50"
          style={{ zIndex: 10 }}
        />
        <div className="flex items-center justify-between px-4 h-[52px] sidebar-border border-b">
          <div className="sidebar-text font-semibold">Source</div>
          <button onClick={() => setShowSettings(true)} className="sidebar-icon-btn rounded p-1">
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
              <div className="flex items-center justify-between px-2">
                <span className="sidebar-text-muted text-xs uppercase tracking-wide">
                  {cat === 'pro' ? 'Pro' : 'Perso'}
                </span>
                <button onClick={() => setYearModalCat(cat)} className="sidebar-icon-btn rounded p-0.5" title="Ajouter une année">
                  <i className="ti ti-plus" style={{ fontSize: '0.85rem' }} />
                </button>
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
              setShowTrash(false)
            }}
            className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm ${showDashboard ? 'sidebar-selected' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setShowArchived(v => !v)
              setShowDashboard(false)
              setShowTrash(false)
            }}
            className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm ${showArchived ? 'sidebar-selected' : ''}`}
          >
            Archivés
          </button>
          <button onClick={exportCSV} className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowTrash(v => !v)
              setShowDashboard(false)
              setShowArchived(false)
            }}
            className={`sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm ${showTrash ? 'sidebar-selected' : ''}`}
          >
            Corbeille{trashedProjects.length > 0 ? ` (${trashedProjects.length})` : ''}
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
          {showTrash
            ? 'Corbeille'
            : `${selectedCat === 'pro' ? 'Pro' : 'Perso'} · ${selectedYear}${
                showDashboard ? ' · Dashboard' : showArchived ? ' · Archivés' : ''
              }`}
        </h1>

        {showTrash ? (
          <TrashView
            projects={trashedProjects}
            onRestore={handleRestoreProject}
            onDeleteForever={id => setDeleteTarget({ type: 'project-permanent', id })}
          />
        ) : showDashboard ? (
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
                      onOpenDetail={() => setSelectedDetailId(p.id)}
                      onChangeStatus={status => handleChangeStatus(p, status)}
                      onChangeSubStatus={(sub, status) => handleChangeSubStatus(p.id, sub, status)}
                      onReorderSubprojects={reordered => handleReorderSubprojects(p.id, reordered)}
                      onChangeImportance={importance => handleChangeImportance(p, importance)}
                      onCopyNumber={() => handleCopyNumber(p.number)}
                      onEdit={() => setModalProject(p)}
                      onDelete={() => setDeleteTarget({ type: 'project', id: p.id })}
                      onArchive={() => handleArchiveProject(p)}
                      onDuplicate={() => handleDuplicateProject(p)}
                      onAddSubproject={() => setSubModalTarget({ parentId: p.id })}
                      onEditSubproject={sub => setSubModalTarget({ parentId: p.id, sub })}
                      onDeleteSubproject={sub => setDeleteTarget({ type: 'subproject', id: sub.id, parentId: p.id })}
                      onArchiveSubproject={sub => handleArchiveSubproject(p.id, sub)}
                      onDuplicateSubproject={sub => handleDuplicateSubproject(p.id, sub)}
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
          editors={allEditors}
          clients={allClients}
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
              : deleteTarget.type === 'project-permanent'
              ? 'Supprimer définitivement'
              : deleteTarget.type === 'subproject'
              ? 'Supprimer le sous-projet'
              : 'Supprimer la note'
          }
          message={
            deleteTarget.type === 'project'
              ? 'Le projet sera déplacé dans la corbeille.'
              : deleteTarget.type === 'project-permanent'
              ? 'Action irréversible. Sous-projets et notes inclus.'
              : 'Cette action est définitive.'
          }
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          prefs={prefs}
          onChange={patch => setPrefs(p => ({ ...p, ...patch }))}
          onClose={() => setShowSettings(false)}
        />
      )}

      {yearModalCat && (
        <YearModal onConfirm={year => addYear(yearModalCat, year)} onClose={() => setYearModalCat(null)} />
      )}

      {selectedDetailProject && (
        <DetailPanel
          project={selectedDetailProject}
          onClose={() => setSelectedDetailId(null)}
          onEdit={() => setModalProject(selectedDetailProject)}
          onDuplicate={() => handleDuplicateProject(selectedDetailProject)}
          onArchive={() => handleArchiveProject(selectedDetailProject)}
          onDelete={() => setDeleteTarget({ type: 'project', id: selectedDetailProject.id })}
          onAddSubproject={() => setSubModalTarget({ parentId: selectedDetailProject.id })}
          onEditSubproject={sub => setSubModalTarget({ parentId: selectedDetailProject.id, sub })}
          onDeleteSubproject={sub =>
            setDeleteTarget({ type: 'subproject', id: sub.id, parentId: selectedDetailProject.id })
          }
          onAddNote={subprojectId => setNoteModalTarget({ projectId: selectedDetailProject.id, subprojectId })}
          onEditNote={(note, subprojectId) =>
            setNoteModalTarget({ projectId: selectedDetailProject.id, subprojectId, note })
          }
          onDeleteNote={(note, subprojectId) =>
            setDeleteTarget({ type: 'note', id: note.id, projectId: selectedDetailProject.id, subprojectId })
          }
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  )
}
