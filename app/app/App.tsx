'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project } from './types'

interface AppProps {
  initialProjects: Project[]
  userId: string
  userEmail?: string
}

export default function App({ initialProjects, userEmail }: AppProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div id="body" className="flex h-screen overflow-hidden">
      {/* Sidebar — toujours sombre, parité visuelle avec idee/La-fabrique */}
      <aside
        id="sidebar"
        className="sidebar-bg flex flex-col shrink-0"
        style={{ width: 264 }}
      >
        <div className="flex items-center justify-between px-4 h-[52px] sidebar-border border-b">
          <div className="sidebar-text font-semibold">Source</div>
          <button className="sidebar-icon-btn rounded p-1">
            <i className="ti ti-settings" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <button className="w-full rounded-lg btn-primary-bg px-3 py-2 text-sm font-medium" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}>
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
          <div className="sidebar-text-muted px-2 text-xs uppercase tracking-wide">Pro</div>
          <div className="sidebar-text-muted px-2 pt-3 text-xs uppercase tracking-wide">Perso</div>
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
        <h1 className="text-xl font-semibold">{initialProjects.length} projet(s)</h1>
        <p className="t-text-muted mt-2 text-sm">
          Coquille en place — les vues (liste, dashboard, modals…) seront portées depuis La-fabrique.
        </p>
      </main>
    </div>
  )
}
