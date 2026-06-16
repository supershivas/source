'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type View = 'login' | 'reset-request' | 'reset-sent'

export default function LoginPage() {
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  async function handleSignup() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError('Vérifie tes emails pour confirmer ton compte !')
      setLoading(false)
    }
  }

  async function handleSendReset() {
    if (!email) {
      setError('Saisis ton adresse email.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setView('reset-sent')
  }

  if (view === 'reset-request' || view === 'reset-sent') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Source</h1>
        <div className="flex flex-col gap-3 w-80">
          {view === 'reset-sent' ? (
            <div className="text-center">
              <p className="text-2xl mb-2">✉️</p>
              <p className="font-semibold mb-1">Email envoyé !</p>
              <p className="text-sm text-gray-500">
                Consulte ta boîte mail et clique sur le lien pour définir un nouveau mot de passe.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Saisis ton adresse email pour recevoir un lien de réinitialisation.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendReset()}
                className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleSendReset}
                disabled={loading}
                className="rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Envoyer le lien
              </button>
            </>
          )}
          <button
            onClick={() => {
              setView('login')
              setError('')
            }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Retour à la connexion
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Source</h1>
      <div className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="rounded-lg bg-black px-6 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Se connecter
        </button>
        <button
          onClick={handleSignup}
          disabled={loading}
          className="rounded-lg border px-6 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Créer un compte
        </button>
        <button
          onClick={() => {
            setView('reset-request')
            setError('')
          }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </main>
  )
}
