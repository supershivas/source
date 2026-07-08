'use client'
import React from 'react'
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Category, Importance, Note, Project, Status, Subproject } from './types'
import ProjectModal, { ProjectFormValues } from './components/ProjectModal'
import SubprojectModal, { SubprojectFormValues } from './components/SubprojectModal'
import NoteModal, { NoteFormValues } from './components/NoteModal'
import ConfirmModal from './components/ConfirmModal'
import SortableProjectCard from './components/SortableProjectCard'
import SortableSubprojectCard from './components/SortableSubprojectCard'
import FilterBar, { SortMode } from './components/FilterBar'
import Dashboard from './components/Dashboard'
import TrashView from './components/TrashView'
import SettingsModal, { useSettingsPrefs } from './components/SettingsModal'
import YearModal from './components/YearModal'
import ToastStack, { Toast } from './components/ToastStack'
import { STATUS_LABELS, IMPORTANCE_LABELS, AUTO_PROGRESS, STATUS_ACCENT, toEU } from './constants'
import DetailPanel from './components/DetailPanel'
import SubprojectDetailPanel from './components/SubprojectDetailPanel'
import DuplicateSubModal from './components/DuplicateSubModal'
import CommandPalette from './components/CommandPalette'
import CalendarView from './components/CalendarView'
import BulkActionBar from './components/BulkActionBar'
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
type DuplicateSubTarget = { sub: Subproject; parentId: string }

export default function App({ initialProjects, userId, userEmail }: AppProps) {
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
  const [duplicateSubTarget, setDuplicateSubTarget] = useState<DuplicateSubTarget | null>(null)

  // Detail panel — projets
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)
  // Detail panel — sous-projets
  const [selectedDetailSubId, setSelectedDetailSubId] = useState<string | null>(null)
  const [selectedDetailParentId, setSelectedDetailParentId] = useState<string | null>(null)

  const closingDetailIdRef = useRef<string | null>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; connectorW: number; connectorTop: number; color: string } | null>(null)
  const [panelReady, setPanelReady] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sidebarW, setSidebarW] = useState(264)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set())

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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

  async function handleUpdateProjectField(p: Project, patch: Partial<Project>) {
    const oldPatch: Partial<Project> = {}
    for (const k of Object.keys(patch) as (keyof Project)[]) {
      (oldPatch as Record<string, unknown>)[k] = p[k]
    }
    updateProject(p.id, patch)
    const { error } = await supabase.from('projects').update(patch).eq('id', p.id)
    if (error) { updateProject(p.id, oldPatch); showToast('Erreur lors de la sauvegarde', 'error'); return }
    const id = Date.now() + Math.random()
    const timer = setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500)
    setToasts(ts => [...ts, {
      id, message: 'Modifié', type: 'success' as const,
      action: {
        label: 'Annuler',
        onClick: async () => {
          clearTimeout(timer)
          setToasts(ts => ts.filter(t => t.id !== id))
          updateProject(p.id, oldPatch)
          await supabase.from('projects').update(oldPatch).eq('id', p.id)
        },
      },
    }])
  }

  async function handleUpdateSubField(parentId: string, sub: Subproject, patch: Partial<Subproject>) {
    const { error } = await supabase.from('subprojects').update(patch).eq('id', sub.id)
    if (!error) {
      setProjects(ps => ps.map(p => p.id !== parentId ? p : {
        ...p, subprojects: (p.subprojects || []).map(s => s.id !== sub.id ? s : { ...s, ...patch }),
      }))
    }
  }

  const searchInputRef = useRef<HTMLInputElement>(null)
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
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
    () => selectedDetailId ? projects.find(p => p.id === selectedDetailId) || null : null,
    [projects, selectedDetailId]
  )

  const selectedDetailSub = useMemo(
    () => selectedDetailSubId && selectedDetailParentId
      ? projects.find(p => p.id === selectedDetailParentId)?.subprojects?.find(s => s.id === selectedDetailSubId) || null
      : null,
    [projects, selectedDetailSubId, selectedDetailParentId]
  )

  const selectedDetailSubParent = useMemo(
    () => selectedDetailParentId ? projects.find(p => p.id === selectedDetailParentId) || null : null,
    [projects, selectedDetailParentId]
  )

  // Panel position — handles both project and subproject detail panels
  useEffect(() => {
    const activeId = selectedDetailSubId || selectedDetailId
    const activeStatus = selectedDetailSub?.status || selectedDetailProject?.status
    if (!activeId || !activeStatus) { setPanelPos(null); setPanelReady(false); return }
    const PANEL_W = 400
    const GAP = 12
    function compute() {
      const card = document.querySelector<HTMLElement>(`[data-card-id="${activeId}"]`)
      if (!card) return
      const rect = card.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const spaceRight = vw - rect.right - GAP
      if (spaceRight < PANEL_W + GAP) { setPanelPos(null); setPanelReady(true); return }
      const panelH = vh - 96
      const top = Math.max(80, Math.min(rect.top, vh - panelH - 8))
      const connectorTop = rect.top + Math.min(24, rect.height / 2)
      const color = STATUS_ACCENT[activeStatus] || 'var(--border)'
      setPanelPos({ top, left: rect.right + GAP, connectorW: GAP, connectorTop, color })
      setPanelReady(true)
    }
    compute()
    window.addEventListener('resize', compute)
    document.getElementById('main')?.addEventListener('scroll', compute)
    return () => {
      window.removeEventListener('resize', compute)
      document.getElementById('main')?.removeEventListener('scroll', compute)
    }
  }, [selectedDetailId, selectedDetailSubId, selectedDetailProject, selectedDetailSub])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === 'k')) {
        e.preventDefault()
        setShowCommandPalette(true)
        return
      }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      if (e.key === 'Escape') {
        if (selectedDetailId || selectedDetailSubId) {
          setSelectedDetailId(null); setSelectedDetailSubId(null); setSelectedDetailParentId(null); return
        }
        if (showCalendar || showDashboard || showArchived || showTrash) {
          setShowCalendar(false); setShowDashboard(false); setShowArchived(false); setShowTrash(false)
          return
        }
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
  }, [exportCSV, selectedDetailId, selectedDetailSubId, showCalendar, showDashboard, showArchived, showTrash])

  // Outside-click closes either project or subproject detail panel
  useEffect(() => {
    if (!selectedDetailId && !selectedDetailSubId) return
    function onMouseDown(e: MouseEvent) {
      if (noteModalTarget || deleteTarget || subModalTarget) return
      const t = e.target as Element
      if (!document.contains(t)) return
      if (t.closest('[data-detail-panel]')) return
      const activeId = selectedDetailSubId || selectedDetailId
      if (t.closest(`[data-card-id="${activeId}"]`)) return
      closingDetailIdRef.current = activeId
      setTimeout(() => { closingDetailIdRef.current = null }, 0)
      setSelectedDetailId(null)
      setSelectedDetailSubId(null)
      setSelectedDetailParentId(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [selectedDetailId, selectedDetailSubId, noteModalTarget, deleteTarget, subModalTarget])

  // Filter helpers
  function projectMatchesFilters(p: Project): boolean {
    if (filterStatus && p.status !== filterStatus) return false
    if (filterImportance && p.importance !== filterImportance) return false
    if (filterEditor && !(p.editor && p.editor.toLowerCase().includes(filterEditor.toLowerCase()))) return false
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      if (!p.name.toLowerCase().includes(q) &&
          !p.number.toLowerCase().includes(q) &&
          !(p.editor && p.editor.toLowerCase().includes(q)) &&
          !(p.client && p.client.toLowerCase().includes(q)) &&
          !(p.notes || []).some(n => n.text.toLowerCase().includes(q))) return false
    }
    return true
  }

  function subMatchesFilters(s: Subproject): boolean {
    if (filterStatus && s.status !== filterStatus) return false
    if (filterImportance || filterEditor) return false  // subs don't have these fields
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      if (!s.name.toLowerCase().includes(q) &&
          !s.number.toLowerCase().includes(q) &&
          !(s.notes || []).some(n => n.text.toLowerCase().includes(q))) return false
    }
    return true
  }

  const visibleProjects = useMemo(() => {
    let list = projects.filter(
      p => p.cat === selectedCat && p.year === selectedYear && !p.trashed && (showArchived ? p.archived : !p.archived)
    )

    if (hasActiveFilters) {
      list = list.filter(p => projectMatchesFilters(p) || (p.subprojects || []).some(subMatchesFilters))
    }

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
  }, [projects, selectedCat, selectedYear, showArchived, searchQuery, filterStatus, filterImportance, filterEditor, sortMode, hasActiveFilters])

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
        rows.push(['↳ Sous-projet', s.number, s.name, p.cat, STATUS_LABELS[s.status] || s.status, `${s.progress ?? 0}%`, '', '', '', '', toEU(s.deadline), toEU(s.ended), ''])
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
  const subSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

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

  function handleSubDragEnd(parentId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const parent = projects.find(p => p.id === parentId)
    if (!parent) return
    const subs = parent.subprojects || []
    const oldIndex = subs.findIndex(s => s.id === active.id)
    const newIndex = subs.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setProjects(ps => ps.map(p => p.id === parentId ? { ...p, subprojects: arrayMove(subs, oldIndex, newIndex) } : p))
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
    const { initialNote, ...dbValues } = values
    const cleanProject = {
      number: dbValues.number,
      name: dbValues.name,
      cat: dbValues.cat,
      year: dbValues.year,
      status: dbValues.status,
      progress: dbValues.progress,
      importance: dbValues.importance,
      editor: dbValues.editor || null,
      client: dbValues.client || null,
      date: dbValues.date || null,
      deadline: dbValues.deadline || null,
    }
    if (modalProject) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...cleanProject, updated_at: new Date().toISOString() })
        .eq('id', modalProject.id)
        .select()
        .single()
      if (!error && data) {
        updateProject(data.id, data)
        showToast('Projet mis à jour ✓')
      } else if (error) showToast('Erreur lors de la mise à jour', 'error')
    } else {
      const maxSort = projects.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
      const payload = {
        ...cleanProject,
        user_id: userId,
        archived: false,
        sort_order: maxSort + 1,
      }
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single()
      if (!error && data) {
        let notes: import('./types').Note[] = []
        if (initialNote.trim()) {
          const { data: noteData } = await supabase
            .from('notes')
            .insert({ text: initialNote.trim(), project_id: data.id })
            .select()
            .single()
          if (noteData) notes = [noteData]
        }
        setProjects(ps => [...ps, { ...data, subprojects: [], notes }])
        setSelectedCat(values.cat)
        setSelectedYear(values.year)
        showToast('Projet créé ✓')
      } else if (error) showToast('Erreur lors de la création', 'error')
    }
    setModalProject(undefined)
  }

  async function handleDeleteProject(id: string) {
    await supabase.from('subprojects').delete().eq('parent_id', id)
    await supabase.from('notes').delete().eq('project_id', id)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      setProjects(ps => ps.filter(p => p.id !== id))
      showToast('Projet supprimé')
      if (selectedDetailId === id) { setSelectedDetailId(null) }
      if (selectedDetailParentId === id) { setSelectedDetailSubId(null); setSelectedDetailParentId(null) }
    }
    setDeleteTarget(null)
  }

  async function handleArchiveProject(p: Project) {
    const archived = !p.archived
    const { error } = await supabase.from('projects').update({ archived }).eq('id', p.id)
    if (!error) {
      updateProject(p.id, { archived })
      showToast(archived ? 'Projet archivé' : 'Projet désarchivé', archived ? 'archive' : 'success')
    }
  }

  async function handleChangeStatus(p: Project, status: Status) {
    const progress = AUTO_PROGRESS[status]
    const patch: Partial<Project> = progress == null ? { status } : { status, progress }
    const { error } = await supabase.from('projects').update(patch).eq('id', p.id)
    if (!error) {
      updateProject(p.id, patch)
      const noteText = `→ ${STATUS_LABELS[status]}`
      const { data: noteData } = await supabase.from('notes').insert({ text: noteText, project_id: p.id }).select().single()
      if (noteData) {
        setProjects(ps => ps.map(proj => proj.id === p.id ? { ...proj, notes: [...(proj.notes || []), noteData] } : proj))
      }
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

  async function handleChangeProgress(p: Project, progress: number) {
    const { error } = await supabase.from('projects').update({ progress }).eq('id', p.id)
    if (!error) updateProject(p.id, { progress })
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
      // Auto-note sur le sous-projet (visible dans le log du sous-projet et du parent)
      const noteText = `→ ${STATUS_LABELS[status]}`
      const { data: noteData } = await supabase.from('notes').insert({ text: noteText, project_id: null, subproject_id: sub.id }).select().single()
      if (noteData) {
        setProjects(ps => ps.map(p => p.id !== parentId ? p : {
          ...p, subprojects: (p.subprojects || []).map(s => s.id !== sub.id ? s : { ...s, notes: [...(s.notes || []), noteData] }),
        }))
      }
      showToast('Statut mis à jour ✓')
    }
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
        user_id: userId,
        archived: false,
        sort_order: maxSort + 1,
      })
      .select()
      .single()
    if (error || !newProject) return

    const newSubprojects: Subproject[] = []
    for (const s of p.subprojects || []) {
      const { data: newSub } = await supabase
        .from('subprojects')
        .insert({ parent_id: newProject.id, number: s.number, name: s.name, status: s.status, progress: s.progress })
        .select()
        .single()
      if (newSub) newSubprojects.push({ ...newSub, notes: [] })
    }

    const newNotes: Note[] = []
    for (const n of p.notes || []) {
      const { data: newNote } = await supabase
        .from('notes')
        .insert({ text: n.text, project_id: newProject.id })
        .select()
        .single()
      if (newNote) newNotes.push(newNote)
    }

    setProjects(ps => [...ps, { ...newProject, subprojects: newSubprojects, notes: newNotes }])
    showToast(`Projet dupliqué ✓`)
  }

  async function handleDuplicateSubAsSub(parentId: string, sub: Subproject) {
    const { data: newSub, error } = await supabase
      .from('subprojects')
      .insert({ parent_id: parentId, number: `${sub.number}b`, name: `${sub.name} (copie)`, status: sub.status, progress: sub.progress })
      .select()
      .single()
    if (error || !newSub) return
    setProjects(ps =>
      ps.map(p => p.id === parentId ? { ...p, subprojects: [...(p.subprojects || []), { ...newSub, notes: [] }] } : p)
    )
    showToast('Sous-projet dupliqué ✓')
    setDuplicateSubTarget(null)
  }

  async function handleDuplicateSubAsProject(parentId: string, sub: Subproject) {
    const parent = projects.find(p => p.id === parentId)
    if (!parent) return
    const maxSort = projects.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        number: sub.number,
        name: `${sub.name} (copie)`,
        cat: parent.cat,
        year: parent.year,
        status: sub.status,
        progress: sub.progress,
        importance: 'medium',
        deadline: sub.deadline || null,
        ended: sub.ended || null,
        user_id: userId,
        archived: false,
        sort_order: maxSort + 1,
      })
      .select()
      .single()
    if (error || !newProject) return

    const newNotes: Note[] = []
    for (const n of sub.notes || []) {
      const { data: newNote } = await supabase
        .from('notes')
        .insert({ text: n.text, project_id: newProject.id, subproject_id: null })
        .select()
        .single()
      if (newNote) newNotes.push(newNote)
    }

    setProjects(ps => [...ps, { ...newProject, subprojects: [], notes: newNotes }])
    showToast(`${sub.name} dupliqué en projet ✓`)
    setDuplicateSubTarget(null)
  }

  async function handleRestoreProject(id: string) {
    showToast('Corbeille non disponible (colonne absente en DB)')
  }

  async function handleDeleteProjectForever(id: string) {
    await supabase.from('subprojects').delete().eq('parent_id', id)
    await supabase.from('notes').delete().eq('project_id', id)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      setProjects(ps => ps.filter(p => p.id !== id))
      showToast('Projet supprimé définitivement')
      if (selectedDetailId === id) setSelectedDetailId(null)
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
        .update({ ...values, deadline: values.deadline || null })
        .eq('id', sub.id)
        .select()
        .single()
      if (error) { showToast(error.message, 'error') } else if (data) {
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
        .insert({ ...values, deadline: values.deadline || null, parent_id: parentId })
        .select()
        .single()
      if (error) { showToast(error.message, 'error') } else if (data) {
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
      if (selectedDetailSubId === target.id) { setSelectedDetailSubId(null); setSelectedDetailParentId(null) }
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
        .update({ text: values.text })
        .eq('id', note.id)
        .select()
        .single()
      if (error) {
        showToast(`Erreur : ${error.message}`, 'error')
      } else if (data) {
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
          project_id: subprojectId ? null : projectId,
          subproject_id: subprojectId || null,
        })
        .select()
        .single()
      if (error) {
        showToast(`Erreur : ${error.message}`, 'error')
      } else if (data) {
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

  async function handleQuickAddNote(projectId: string, text: string) {
    const { data, error } = await supabase.from('notes').insert({ text, project_id: projectId, subproject_id: null }).select().single()
    if (error) { showToast(`Erreur : ${error.message}`, 'error'); return }
    if (data) setProjects(ps => ps.map(p => p.id !== projectId ? p : { ...p, notes: [...(p.notes || []), data] }))
  }

  async function handleQuickAddSubNote(parentId: string, subprojectId: string, text: string) {
    const { data, error } = await supabase.from('notes').insert({ text, project_id: null, subproject_id: subprojectId }).select().single()
    if (error) { showToast(`Erreur : ${error.message}`, 'error'); return }
    if (data) {
      setProjects(ps => ps.map(p => p.id !== parentId ? p : {
        ...p,
        subprojects: (p.subprojects || []).map(s => s.id !== subprojectId ? s : { ...s, notes: [...(s.notes || []), data] }),
      }))
    }
  }

  async function handleDeleteNote(target: { id: string; projectId: string; subprojectId?: string }) {
    const proj = projects.find(p => p.id === target.projectId)
    const deleted = target.subprojectId
      ? proj?.subprojects?.find(s => s.id === target.subprojectId)?.notes?.find(n => n.id === target.id)
      : proj?.notes?.find(n => n.id === target.id)

    const { error } = await supabase.from('notes').delete().eq('id', target.id)
    if (error) {
      showToast(`Erreur : ${error.message}`, 'error')
    } else {
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
      const id = Date.now() + Math.random()
      const timer = setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500)
      setToasts(ts => [...ts, {
        id, message: 'Note supprimée', type: 'success' as const,
        action: deleted ? {
          label: 'Annuler',
          onClick: async () => {
            clearTimeout(timer)
            setToasts(ts => ts.filter(t => t.id !== id))
            const { data: restored } = await supabase.from('notes').insert({
              text: deleted.text,
              project_id: deleted.project_id,
              subproject_id: deleted.subproject_id,
            }).select().single()
            if (restored) {
              setProjects(ps => ps.map(p => {
                if (p.id !== target.projectId) return p
                if (target.subprojectId) {
                  return { ...p, subprojects: (p.subprojects || []).map(s =>
                    s.id === target.subprojectId ? { ...s, notes: [...(s.notes || []), restored] } : s
                  )}
                }
                return { ...p, notes: [...(p.notes || []), restored] }
              }))
            }
          },
        } : undefined,
      }])
    }
    setDeleteTarget(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkStatus(status: Status) {
    const ids = [...selectedIds]
    const progress = AUTO_PROGRESS[status]
    const patch: Partial<Project> = progress == null ? { status } : { status, progress }
    setProjects(ps => ps.map(p => ids.includes(p.id) ? { ...p, ...patch } : p))
    await Promise.all(ids.map(id => supabase.from('projects').update(patch).eq('id', id)))
    showToast(`Statut mis à jour (${ids.length})`)
    setSelectedIds(new Set())
  }

  async function handleBulkArchive() {
    const ids = [...selectedIds]
    setProjects(ps => ps.map(p => ids.includes(p.id) ? { ...p, archived: true } : p))
    await Promise.all(ids.map(id => supabase.from('projects').update({ archived: true }).eq('id', id)))
    showToast(`${ids.length} projet${ids.length > 1 ? 's' : ''} archivé${ids.length > 1 ? 's' : ''}`, 'archive')
    setSelectedIds(new Set())
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    setProjects(ps => ps.filter(p => !ids.includes(p.id)))
    await Promise.all(ids.map(id => supabase.from('projects').delete().eq('id', id)))
    showToast(`${ids.length} projet${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''}`)
    setSelectedIds(new Set())
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'project') handleDeleteProject(deleteTarget.id)
    else if (deleteTarget.type === 'project-permanent') handleDeleteProjectForever(deleteTarget.id)
    else if (deleteTarget.type === 'subproject') handleDeleteSubproject(deleteTarget)
    else handleDeleteNote(deleteTarget)
  }

  function toggleParentCollapse(id: string) {
    setCollapsedParents(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div id="body" className="flex h-screen overflow-hidden">
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`sidebar-bg flex flex-col shrink-0 relative transition-transform duration-200 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : ''
        }`}
        style={{ width: isMobile ? 240 : sidebarW, minWidth: isMobile ? undefined : 200, maxWidth: isMobile ? undefined : 420 }}
      >
        {!isMobile && (
          <div
            onMouseDown={startSidebarResize}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-[var(--accent)] hover:opacity-50"
            style={{ zIndex: 10 }}
          />
        )}
        <div className="flex items-center justify-between px-3 gap-2 sidebar-border border-b" style={{ minHeight: '52px' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 24, height: 24, fontSize: '0.85rem', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
            >
              ✦
            </div>
            <span className="sidebar-text font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>Source</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center rounded-lg transition-colors sidebar-icon-btn"
            style={{ width: 32, height: 32 }}
          >
            <i className="ti ti-settings" style={{ fontSize: '15px' }} />
          </button>
        </div>

        <div className="px-2 pt-2 pb-1">
          <button
            onClick={() => { setModalProject(null); if (isMobile) setMobileSidebarOpen(false) }}
            className="w-full relative flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors"
            style={{ height: 40, padding: '0 12px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
          >
            <i className="ti ti-plus" style={{ fontSize: '15px' }} />
            <span>Nouveau projet</span>
            <kbd
              className="absolute text-[10px] px-1.5 py-0.5 rounded font-mono opacity-60"
              style={{ right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)' }}
            >
              N
            </kbd>
          </button>
        </div>

        <div className="relative px-2 py-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3"
            style={{ height: 36, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <i className="ti ti-search" style={{ fontSize: '13px', color: 'var(--sidebar-icon)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher…  ⌘K"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 outline-none bg-transparent min-w-0"
              style={{ color: 'var(--sidebar-fg)', fontSize: '13px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 flex items-center justify-center text-sm flex-shrink-0"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-1">
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
                const count = projects.filter(p => p.cat === cat && p.year === year && !p.archived && !p.trashed).length
                return (
                  <button
                    key={`${cat}-${year}`}
                    onClick={() => { selectYear(cat, year); if (isMobile) setMobileSidebarOpen(false) }}
                    className={`sidebar-item-hover sidebar-text w-full flex items-center justify-between text-left text-sm font-medium ${active ? 'sidebar-selected' : ''}`}
                    style={{ padding: '8px 12px', borderRadius: 6, margin: '1px 0' }}
                  >
                    <span>{year}</span>
                    <span
                      className="text-[10px] font-semibold flex-shrink-0"
                      style={{
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: active ? 'rgba(192,57,43,0.35)' : 'rgba(255,255,255,0.10)',
                        color: active ? 'var(--sidebar-selected-fg)' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-2 py-2 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <button
            onClick={() => {
              setShowCalendar(v => !v)
              setShowDashboard(false)
              setShowArchived(false)
              setShowTrash(false)
              if (isMobile) setMobileSidebarOpen(false)
            }}
            className={`sidebar-item-hover w-full flex items-center gap-2 text-left text-sm ${showCalendar ? 'sidebar-selected' : ''}`}
            style={{ padding: '8px 12px', borderRadius: 6, color: showCalendar ? 'var(--sidebar-selected-fg)' : 'var(--sidebar-muted)' }}
          >
            <i className="ti ti-calendar" style={{ fontSize: '15px', flexShrink: 0 }} />
            <span className="flex-1">Calendrier</span>
          </button>
          <button
            onClick={() => {
              setShowDashboard(v => !v)
              setShowCalendar(false)
              setShowArchived(false)
              setShowTrash(false)
              if (isMobile) setMobileSidebarOpen(false)
            }}
            className={`sidebar-item-hover w-full flex items-center gap-2 text-left text-sm ${showDashboard ? 'sidebar-selected' : ''}`}
            style={{ padding: '8px 12px', borderRadius: 6, color: showDashboard ? 'var(--sidebar-selected-fg)' : 'var(--sidebar-muted)' }}
          >
            <i className="ti ti-chart-bar" style={{ fontSize: '15px', flexShrink: 0 }} />
            <span className="flex-1">Dashboard</span>
          </button>
          <button
            onClick={() => {
              setShowArchived(v => !v)
              setShowDashboard(false)
              setShowTrash(false)
              if (isMobile) setMobileSidebarOpen(false)
            }}
            className={`sidebar-item-hover w-full flex items-center gap-2 text-left text-sm ${showArchived ? 'sidebar-selected' : ''}`}
            style={{ padding: '8px 12px', borderRadius: 6, color: showArchived ? 'var(--sidebar-selected-fg)' : 'var(--sidebar-muted)' }}
          >
            <i className="ti ti-archive" style={{ fontSize: '15px', flexShrink: 0 }} />
            <span className="flex-1">Archivés</span>
          </button>
          <button
            onClick={exportCSV}
            className="sidebar-item-hover w-full flex items-center gap-2 text-left text-sm"
            style={{ padding: '8px 12px', borderRadius: 6, color: 'var(--sidebar-muted)' }}
          >
            <i className="ti ti-download" style={{ fontSize: '15px', flexShrink: 0 }} />
            <span className="flex-1">Export CSV</span>
          </button>
          <button
            onClick={() => {
              setShowTrash(v => !v)
              setShowDashboard(false)
              setShowArchived(false)
              if (isMobile) setMobileSidebarOpen(false)
            }}
            className={`sidebar-item-hover w-full flex items-center gap-2 text-left text-sm ${showTrash ? 'sidebar-selected' : ''}`}
            style={{ padding: '8px 12px', borderRadius: 6, color: showTrash ? 'var(--sidebar-selected-fg)' : 'var(--sidebar-muted)' }}
          >
            <i className="ti ti-trash" style={{ fontSize: '15px', flexShrink: 0 }} />
            <span className="flex-1">Corbeille</span>
            {trashedProjects.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>{trashedProjects.length}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main" className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(v => !v)}
              className="sidebar-icon-btn rounded p-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <i className="ti ti-menu-2" />
            </button>
          )}
          {(() => {
            const isSpecial = showTrash || showCalendar || showDashboard || showArchived
            const specialLabel = showTrash ? 'Corbeille' : showCalendar ? 'Calendrier' : showDashboard ? 'Dashboard' : 'Archivés'
            const baseLabel = `${selectedCat === 'pro' ? 'Pro' : 'Perso'} · ${selectedYear}`
            const goBack = () => { setShowTrash(false); setShowCalendar(false); setShowDashboard(false); setShowArchived(false) }
            if (isSpecial) return (
              <h1 className="text-lg font-semibold flex items-center gap-1.5">
                <button onClick={goBack} className="flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '1rem' }}>
                  {baseLabel}
                </button>
                <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>›</span>
                <span>{specialLabel}</span>
              </h1>
            )
            return <h1 className="text-lg font-semibold">{baseLabel}</h1>
          })()}
        </div>

        {showTrash ? (
          <TrashView
            projects={trashedProjects}
            onRestore={handleRestoreProject}
            onDeleteForever={id => setDeleteTarget({ type: 'project-permanent', id })}
          />
        ) : showCalendar ? (
          <CalendarView projects={projects} onOpenProject={id => { setSelectedDetailId(id); setShowCalendar(false) }} />
        ) : showDashboard ? (
          <Dashboard projects={projects} selectedCat={selectedCat} selectedYear={selectedYear} />
        ) : (
          <>
            {isMobile ? (
              <div className="mb-3">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="rounded-lg border px-3 py-2 text-sm t-border"
                >
                  <i className="ti ti-filter" /> Filtres{hasActiveFilters ? ' •' : ''}
                </button>
              </div>
            ) : (
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
            )}

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
                <div className="flex flex-col gap-2 mx-auto w-full" style={{ maxWidth: '800px' }}>
                  {visibleProjects.map(p => {
                    const isExpanded = !collapsedParents.has(p.id)
                    const pMatches = !hasActiveFilters || projectMatchesFilters(p)
                    const visibleSubs = (p.subprojects || []).filter(s =>
                      !hasActiveFilters || pMatches || subMatchesFilters(s)
                    )
                    const anyPanelOpen = !!(selectedDetailId || selectedDetailSubId)

                    return (
                      <React.Fragment key={p.id}>
                        <SortableProjectCard
                          project={p}
                          dimmed={
                            !!(selectedDetailId && selectedDetailId !== p.id) ||
                            !!(selectedDetailSubId && selectedDetailParentId !== p.id)
                          }
                          isSelected={selectedIds.has(p.id)}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleParentCollapse(p.id)}
                          onToggleSelect={() => toggleSelect(p.id)}
                          onOpenDetail={() => {
                            if (closingDetailIdRef.current === p.id) { closingDetailIdRef.current = null; return }
                            closingDetailIdRef.current = null
                            setSelectedDetailSubId(null)
                            setSelectedDetailParentId(null)
                            setSelectedDetailId(prev => prev === p.id ? null : p.id)
                          }}
                          onChangeStatus={status => handleChangeStatus(p, status)}
                          onChangeImportance={importance => handleChangeImportance(p, importance)}
                          onCopyNumber={() => handleCopyNumber(p.number)}
                          onEdit={() => setModalProject(p)}
                          onDelete={() => setDeleteTarget({ type: 'project', id: p.id })}
                          onArchive={() => handleArchiveProject(p)}
                          onDuplicate={() => handleDuplicateProject(p)}
                          onAddSubproject={() => setSubModalTarget({ parentId: p.id })}
                        />

                        {/* Sous-projets inline */}
                        {isExpanded && visibleSubs.length > 0 && (
                          <DndContext sensors={subSensors} collisionDetection={closestCenter} onDragEnd={e => handleSubDragEnd(p.id, e)}>
                            <SortableContext items={visibleSubs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                              {visibleSubs.map(s => (
                                <SortableSubprojectCard
                                  key={s.id}
                                  sub={s}
                                  parentId={p.id}
                                  dimmed={
                                    !!(selectedDetailId && selectedDetailId !== p.id) ||
                                    !!(selectedDetailSubId && selectedDetailSubId !== s.id)
                                  }
                                  onOpenDetail={() => {
                                    if (closingDetailIdRef.current === s.id) { closingDetailIdRef.current = null; return }
                                    closingDetailIdRef.current = null
                                    setSelectedDetailId(null)
                                    if (selectedDetailSubId === s.id) {
                                      setSelectedDetailSubId(null)
                                      setSelectedDetailParentId(null)
                                    } else {
                                      setSelectedDetailSubId(s.id)
                                      setSelectedDetailParentId(p.id)
                                    }
                                  }}
                                  onChangeStatus={status => handleChangeSubStatus(p.id, s, status)}
                                  onEdit={() => setSubModalTarget({ parentId: p.id, sub: s })}
                                  onDelete={() => setDeleteTarget({ type: 'subproject', id: s.id, parentId: p.id })}
                                  onDuplicate={() => setDuplicateSubTarget({ sub: s, parentId: p.id })}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}

                        {/* Bouton ajouter sous-projet (visible quand déplié) */}
                        {isExpanded && (
                          <div style={{ marginLeft: 32 }}>
                            <button
                              onClick={() => setSubModalTarget({ parentId: p.id })}
                              className="text-xs t-text-muted hover:opacity-80 flex items-center gap-1"
                              style={{ padding: '2px 4px' }}
                            >
                              <i className="ti ti-plus" style={{ fontSize: '0.7rem' }} />
                              Ajouter un sous-projet
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
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
          initial={noteModalTarget.note ? { text: noteModalTarget.note.text } : undefined}
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
          message={(() => {
            if (deleteTarget.type === 'project') {
              const subCount = projects.find(p => p.id === deleteTarget.id)?.subprojects?.length || 0
              return subCount > 0
                ? `Le projet et ses ${subCount} sous-projet${subCount > 1 ? 's' : ''} seront supprimés.`
                : 'Cette action est définitive.'
            }
            if (deleteTarget.type === 'project-permanent') return 'Action irréversible. Sous-projets et notes inclus.'
            return 'Cette action est définitive.'
          })()}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {duplicateSubTarget && (
        <DuplicateSubModal
          sub={duplicateSubTarget.sub}
          onDuplicateAsSub={() => handleDuplicateSubAsSub(duplicateSubTarget.parentId, duplicateSubTarget.sub)}
          onDuplicateAsProject={() => handleDuplicateSubAsProject(duplicateSubTarget.parentId, duplicateSubTarget.sub)}
          onClose={() => setDuplicateSubTarget(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          prefs={prefs}
          onChange={patch => setPrefs(p => ({ ...p, ...patch }))}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
          userId={userId}
          userEmail={userEmail}
          projects={projects}
        />
      )}

      {yearModalCat && (
        <YearModal onConfirm={year => addYear(yearModalCat, year)} onClose={() => setYearModalCat(null)} />
      )}

      {/* Connecteur panneau projet */}
      {selectedDetailProject && panelReady && panelPos && (
        <div
          className="fixed z-39 pointer-events-none detail-connector"
          style={{ top: panelPos.connectorTop, left: panelPos.left - panelPos.connectorW, width: panelPos.connectorW, height: 2, background: panelPos.color, opacity: 0.5 }}
        />
      )}
      {selectedDetailProject && panelReady && (
        <DetailPanel
          project={selectedDetailProject}
          panelRef={detailPanelRef}
          panelPos={panelPos ?? undefined}
          onClose={() => setSelectedDetailId(null)}
          onEdit={() => setModalProject(selectedDetailProject)}
          onUpdateField={patch => handleUpdateProjectField(selectedDetailProject, patch)}
          onDuplicate={() => handleDuplicateProject(selectedDetailProject)}
          onArchive={() => handleArchiveProject(selectedDetailProject)}
          onDelete={() => setDeleteTarget({ type: 'project', id: selectedDetailProject.id })}
          onChangeStatus={status => handleChangeStatus(selectedDetailProject, status)}
          onChangeImportance={importance => handleChangeImportance(selectedDetailProject, importance)}
          onChangeProgress={progress => handleChangeProgress(selectedDetailProject, progress)}
          onAddSubproject={() => setSubModalTarget({ parentId: selectedDetailProject.id })}
          onQuickAddNote={text => handleQuickAddNote(selectedDetailProject.id, text)}
          onEditNote={(note, subprojectId) =>
            setNoteModalTarget({ projectId: selectedDetailProject.id, subprojectId, note })
          }
          onDeleteNote={(note, subprojectId) =>
            setDeleteTarget({ type: 'note', id: note.id, projectId: selectedDetailProject.id, subprojectId })
          }
        />
      )}

      {/* Connecteur panneau sous-projet */}
      {selectedDetailSub && panelReady && panelPos && (
        <div
          className="fixed z-39 pointer-events-none detail-connector"
          style={{ top: panelPos.connectorTop, left: panelPos.left - panelPos.connectorW, width: panelPos.connectorW, height: 2, background: panelPos.color, opacity: 0.5 }}
        />
      )}
      {selectedDetailSub && selectedDetailParentId && panelReady && (
        <SubprojectDetailPanel
          sub={selectedDetailSub}
          parentName={selectedDetailSubParent?.name || ''}
          panelRef={detailPanelRef}
          panelPos={panelPos ?? undefined}
          onClose={() => { setSelectedDetailSubId(null); setSelectedDetailParentId(null) }}
          onEdit={() => setSubModalTarget({ parentId: selectedDetailParentId, sub: selectedDetailSub })}
          onDuplicate={() => setDuplicateSubTarget({ sub: selectedDetailSub, parentId: selectedDetailParentId })}
          onDelete={() => setDeleteTarget({ type: 'subproject', id: selectedDetailSub.id, parentId: selectedDetailParentId })}
          onChangeStatus={status => handleChangeSubStatus(selectedDetailParentId, selectedDetailSub, status)}
          onUpdateField={patch => handleUpdateSubField(selectedDetailParentId, selectedDetailSub, patch)}
          onQuickAddNote={text => handleQuickAddSubNote(selectedDetailParentId, selectedDetailSub.id, text)}
          onEditNote={note => setNoteModalTarget({ projectId: selectedDetailParentId, subprojectId: selectedDetailSub.id, note })}
          onDeleteNote={note => setDeleteTarget({ type: 'note', id: note.id, projectId: selectedDetailParentId, subprojectId: selectedDetailSub.id })}
        />
      )}

      {isMobile && mobileFilterOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl t-bg-card p-4" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Filtres</span>
              <button onClick={() => setMobileFilterOpen(false)} className="sidebar-icon-btn rounded p-1">
                <i className="ti ti-x" />
              </button>
            </div>
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
          </div>
        </>
      )}

      <ToastStack toasts={toasts} />

      {showCommandPalette && (
        <CommandPalette
          projects={projects.filter(p => !p.trashed)}
          onClose={() => setShowCommandPalette(false)}
          onOpenProject={id => { setShowCommandPalette(false); setSelectedDetailId(id) }}
          onNewProject={() => setModalProject(null)}
          onShowDashboard={() => { setShowDashboard(true); setShowCalendar(false); setShowTrash(false); setShowArchived(false) }}
          onShowCalendar={() => { setShowCalendar(true); setShowDashboard(false); setShowTrash(false); setShowArchived(false) }}
          onExportCSV={exportCSV}
          onShowSettings={() => setShowSettings(true)}
        />
      )}

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onSetStatus={handleBulkStatus}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onDeselect={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  )
}
