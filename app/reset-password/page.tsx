'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdate() {
    if (!password || password.length < 8) {
      setError('Mot de passe trop court (8 caractères minimum).')
      return
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/app')
        router.refresh()
      }
    } catch {
      setError('Connexion au serveur impossible. Vérifie ta connexion réseau et réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'border rounded-lg px-4 py-2 outline-none text-sm t-border bg-transparent focus:ring-2'

  return (
    <main className="t-bg-app flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold t-text">Source</h1>
      <div className="t-bg-card rounded-xl p-6 flex flex-col gap-3 w-80" style={{ boxShadow: 'var(--card-shadow)' }}>
        <p className="text-sm t-text-muted">Choisis un nouveau mot de passe.</p>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
          autoFocus
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUpdate()}
          autoComplete="new-password"
          className={inputClass}
        />
        {error && <p className="text-sm" style={{ color: 'var(--s-sent-fg)' }}>{error}</p>}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </main>
  )
}
