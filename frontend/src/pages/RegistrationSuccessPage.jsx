import { Link, useLocation } from 'react-router-dom'

// Confirms successful account creation before the user starts an authenticated session.
function RegistrationSuccessPage() {
  const { state } = useLocation()
  const firstName = state?.name?.trim().split(' ')[0]

  return <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-10">
    <section className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow-elevated)] sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-light)] text-3xl text-[var(--accent)]">✓</div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-[var(--accent)]">Account created</p>
      <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">Congratulations{firstName ? `, ${firstName}` : ''}!</h1>
      <p className="mt-4 leading-7 text-[var(--text-secondary)]">Your Pandawrite account is ready. Log in to start creating workspaces, pages, and media-rich notes.</p>
      <Link to="/login" className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-[var(--btn-primary-bg)] px-4 py-3 font-semibold text-[var(--text-on-accent)] hover:bg-[var(--btn-primary-hover)]">Go to login</Link>
    </section>
  </main>
}

export default RegistrationSuccessPage
