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
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Source</h1>
      <div className="flex flex-col gap-3 w-80">
        <p className="text-sm text-gray-500">Choisis un nouveau mot de passe.</p>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
          autoFocus
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUpdate()}
          autoComplete="new-password"
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </main>
  )
}
