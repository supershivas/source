'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Category, Project } from './types'
import { STATUS_LABELS } from './constants'
import ProjectModal, { ProjectFormValues } from './components/ProjectModal'
import ConfirmModal from './components/ConfirmModal'

interface AppProps {
  initialProjects: Project[]
  userId: string
  userEmail?: string
}

export default function App({ initialProjects, userEmail }: AppProps) {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedCat, setSelectedCat] = useState<Category>('pro')
  const [selectedYear, setSelectedYear] = useState<number>(
    initialProjects.find(p => p.cat === 'pro')?.year || new Date().getFullYear()
  )
  const [modalProject, setModalProject] = useState<Project | null | undefined>(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const visibleProjects = useMemo(
    () => projects.filter(p => p.cat === selectedCat && p.year === selectedYear && !p.trashed && !p.archived),
    [projects, selectedCat, selectedYear]
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function selectYear(cat: Category, year: number) {
    setSelectedCat(cat)
    setSelectedYear(year)
  }

  async function handleSaveProject(values: ProjectFormValues) {
    if (modalProject) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', modalProject.id)
        .select()
        .single()
      if (!error && data) {
        setProjects(ps => ps.map(p => (p.id === data.id ? { ...p, ...data } : p)))
      }
    } else {
      const maxSort = projects.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...values, trashed: false, archived: false, sort_order: maxSort + 1 })
        .select()
        .single()
      if (!error && data) {
        setProjects(ps => [...ps, data])
        setSelectedCat(values.cat)
        setSelectedYear(values.year)
      }
    }
    setModalProject(undefined)
  }

  async function handleDeleteProject(id: string) {
    const { error } = await supabase.from('projects').update({ trashed: true }).eq('id', id)
    if (!error) {
      setProjects(ps => ps.map(p => (p.id === id ? { ...p, trashed: true } : p)))
    }
    setConfirmDeleteId(null)
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
          <button className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
            Dashboard
          </button>
          <button className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
            Archivés
          </button>
          <button className="sidebar-item-hover sidebar-text w-full rounded-lg px-2 py-2 text-left text-sm">
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
        </h1>

        {visibleProjects.length === 0 && (
          <p className="t-text-muted text-sm">Aucun projet pour cette année/catégorie.</p>
        )}

        <div className="flex flex-col gap-2">
          {visibleProjects.map(p => (
            <div key={p.id} className="t-bg-card rounded-lg p-3 flex items-center gap-3" style={{ boxShadow: 'var(--card-shadow)' }}>
              <span className="text-xs t-text-muted w-10 shrink-0">{p.number}</span>
              <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
              <span className={`status-badge s-${p.status}`}>{STATUS_LABELS[p.status]}</span>
              <div className="prog-wrap" style={{ width: 100 }}>
                <div className="prog-bar-bg">
                  <div className="prog-fill-bg" style={{ width: `${p.progress ?? 0}%`, background: 'var(--accent)' }} />
                </div>
                <span className="prog-pct">{p.progress ?? 0}%</span>
              </div>
              <button onClick={() => setModalProject(p)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-edit" />
              </button>
              <button onClick={() => setConfirmDeleteId(p.id)} className="sidebar-icon-btn rounded p-1" style={{ color: 'var(--text-muted)' }}>
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
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

      {confirmDeleteId && (
        <ConfirmModal
          title="Supprimer le projet"
          message="Le projet sera déplacé dans la corbeille."
          onConfirm={() => handleDeleteProject(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
