import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import Toast from '../components/Toast'
import pandaLogo from '../assets/KungFuPanda.jpg'

function getDestination(user) {
  return user?.role === 'masterAdmin' ? '/admin/payments' : '/dashboard'
}

function validateField(name, value) {
  if (!value.trim()) return name === 'email' ? 'Please enter your email address.' : 'Please enter your password.'
  if (name === 'email' && !/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address.'
  return ''
}

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate(getDestination(user), { replace: true })
  }, [navigate, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: validateField(name, value) }))
  }

  const handleBlur = (event) => {
    const { name, value } = event.target
    setFieldErrors((current) => ({ ...current, [name]: validateField(name, value) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    }
    setFieldErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      setToast({ type: 'error', message: 'Please fix the highlighted fields.' })
      return
    }

    setLoading(true)
    try {
      const response = await authService.login({ ...formData, rememberMe })
      sessionStorage.setItem('appToast', JSON.stringify({ type: 'success', message: 'Logged in successfully. Welcome back!' }))
      login(response.data, response.data.token, rememberMe)
    } catch (err) {
      const message = err.response?.status === 400 || err.response?.status === 401
        ? 'Email or password is incorrect.'
        : err.response?.data?.message || 'Unable to log in. Please try again.'
      setToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page-shell relative min-h-screen overflow-hidden bg-[var(--bg)] px-4 py-5 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_5%,var(--accent-light),transparent_28%),radial-gradient(circle_at_92%_90%,var(--gold-light),transparent_25%)]" />
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="login-panel grid w-full overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-elevated)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="login-visual relative hidden min-h-[680px] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <img src={pandaLogo} alt="Panda illustration" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(10,31,23,0.96),rgba(15,67,48,0.82)_52%,rgba(10,20,16,0.92))]" />
            <div className="relative z-10">
              <Link to="/about" className="flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-black/10 px-3 py-2 backdrop-blur-sm transition hover:bg-white/10">
                <img src={pandaLogo} alt="" className="h-10 w-10 rounded-xl border border-[var(--gold)]/60 object-cover" />
                <span className="font-bold tracking-tight">Pandawrite</span>
              </Link>
              <div className="mt-24 max-w-md">
                <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--gold)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> Your calm workspace</p>
                <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.04em]">Turn scattered thoughts into <span className="text-[var(--gold)]">something meaningful.</span></h1>
                <p className="mt-6 max-w-sm text-base leading-7 text-white/70">Keep notes, links, videos, and ideas together so your best work has room to grow.</p>
              </div>
            </div>
            <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-white/55">
              <span>Built for focus</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Private by design</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-14">
            <div className="flex items-center justify-between gap-4">
              <Link to="/about" className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent)]">← Back to introduction</Link>
              <span className="hidden items-center gap-2 text-xs font-medium text-[var(--text-secondary)] sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure sign in</span>
            </div>

            <div className="mt-12 sm:mt-16">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-2xl">🐼</div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Welcome back</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Pick up where you left off and keep your ideas moving.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-primary)]">Email address</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--text-muted)]">@</span>
                  <input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} className={`w-full rounded-xl border bg-[var(--bg-input)] py-3 pl-9 pr-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:ring-4 ${fieldErrors.email ? 'border-red-400 focus:ring-red-100' : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent-light)]'}`} placeholder="you@example.com" />
                </div>
                {fieldErrors.email && <p id="email-error" className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-semibold text-[var(--text-primary)]">Password</label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)] hover:underline">Forgot password?</Link>
                </div>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[var(--text-muted)]">••</span>
                  <input id="password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} onBlur={handleBlur} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} className={`w-full rounded-xl border bg-[var(--bg-input)] py-3 pl-9 pr-16 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:ring-4 ${fieldErrors.password ? 'border-red-400 focus:ring-red-100' : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent-light)]'}`} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                {fieldErrors.password && <p id="password-error" className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] focus:ring-[var(--accent-ring)]" /> Remember me</label>
                <span className="text-xs text-[var(--text-muted)]">30-day access</span>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[var(--btn-primary-bg)] px-4 py-3.5 font-bold text-[var(--text-on-accent)] shadow-lg shadow-[var(--accent-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--btn-primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Signing you in...' : 'Continue to Pandawrite'}</button>
            </form>

            <div className="mt-8 flex items-center gap-3 text-xs text-[var(--text-muted)]"><span className="h-px flex-1 bg-[var(--border)]" /> Your ideas, in balance <span className="h-px flex-1 bg-[var(--border)]" /></div>
            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">New here? <Link to="/register" className="font-bold text-[var(--accent)] transition hover:text-[var(--accent-hover)] hover:underline">Create an account</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
