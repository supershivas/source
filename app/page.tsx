import Link from 'next/link'

export default function Home() {
  return (
    <main className="t-bg-app flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold t-text">Source</h1>
      <Link
        href="/login"
        className="rounded-lg px-6 py-3 text-sm font-medium"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-fg)' }}
      >
        Se connecter
      </Link>
    </main>
  )
}
