import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import App from './App'

export default async function AppPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*, subprojects(*, notes(*)), notes(*)')
      .order('sort_order', { ascending: true })

    if (projectsError) throw projectsError

    return (
      <App
        initialProjects={projects || []}
        userId={user.id}
        userEmail={user.email}
      />
    )
  } catch (e: any) {
    if (e?.message === 'NEXT_REDIRECT') throw e
    redirect('/login')
  }
}
