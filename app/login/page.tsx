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
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ou mot de passe incorrect')
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

  async function handleSignup() {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Vérifie tes emails pour confirmer ton compte !')
    } catch {
      setError('Connexion au serveur impossible. Vérifie ta connexion réseau et réessaie.')
    } finally {
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
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setView('reset-sent')
    } catch {
      setError('Connexion au serveur impossible. Vérifie ta connexion réseau et réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'border rounded-lg px-4 py-2 outline-none text-sm t-border bg-transparent focus:ring-2'
  const inputStyle = { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties

  const primaryBtnClass = 'rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50'
  const primaryBtnStyle = { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }

  const secondaryBtnClass = 'rounded-lg border t-border px-6 py-2 text-sm hover:opacity-80 disabled:opacity-50'

  if (view === 'reset-request' || view === 'reset-sent') {
    return (
      <main className="t-bg-app flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold t-text" style={{ fontFamily: 'var(--font-title)' }}>Source</h1>
        <div className="t-bg-card rounded-xl p-6 flex flex-col gap-3 w-80" style={{ boxShadow: 'var(--card-shadow)' }}>
          {view === 'reset-sent' ? (
            <div className="text-center">
              <p className="text-2xl mb-2">✉️</p>
              <p className="font-semibold mb-1 t-text">Email envoyé !</p>
              <p className="text-sm t-text-muted">
                Consulte ta boîte mail et clique sur le lien pour définir un nouveau mot de passe.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm t-text-muted">
                Saisis ton adresse email pour recevoir un lien de réinitialisation.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendReset()}
                className={inputClass}
                style={inputStyle}
                autoFocus
              />
              {error && <p className="text-sm" style={{ color: 'var(--s-sent-fg)' }}>{error}</p>}
              <button onClick={handleSendReset} disabled={loading} className={primaryBtnClass} style={primaryBtnStyle}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </>
          )}
          <button
            onClick={() => {
              setView('login')
              setError('')
            }}
            className="text-sm t-text-muted hover:opacity-80"
          >
            ← Retour à la connexion
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="t-bg-app flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold t-text">Source</h1>
      <div className="t-bg-card rounded-xl p-6 flex flex-col gap-3 w-80" style={{ boxShadow: 'var(--card-shadow)' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className={inputClass}
          style={inputStyle}
        />
        {error && <p className="text-sm" style={{ color: 'var(--s-sent-fg)' }}>{error}</p>}
        {info && <p className="text-sm" style={{ color: 'var(--s-done-fg)' }}>{info}</p>}
        <button onClick={handleLogin} disabled={loading} className={primaryBtnClass} style={primaryBtnStyle}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <button onClick={handleSignup} disabled={loading} className={secondaryBtnClass}>
          Créer un compte
        </button>
        <button
          onClick={() => {
            setView('reset-request')
            setError('')
            setInfo('')
          }}
          className="text-sm t-text-muted hover:opacity-80"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </main>
  )
}
