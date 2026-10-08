import { useState } from 'react'
import { useNavigate ,Link } from 'react-router-dom'
import { authService } from '../services/authService'

function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.register(formData)
      // Registration intentionally ends at a confirmation screen; users choose when to begin a session.
      navigate('/registration-success', { replace: true, state: { name: formData.name } })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] p-8 rounded-xl shadow-[var(--shadow-elevated)] w-full max-w-sm border border-[var(--border)]"
      >
        <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Create account</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2.5 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2.5 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
          className="w-full mb-4 p-2.5 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--btn-primary-bg)] text-[var(--text-on-accent)] py-2.5 rounded-xl font-semibold transition hover:bg-[var(--btn-primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--text-secondary)]/40 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-sm mt-4 text-center text-[var(--text-secondary)]">
          Already have an account? <Link to ="/login" className="font-semibold text-[var(--accent)] hover:underline" >Log in</Link>
        </p>
      </form>
    </div>
  )
}

export default RegisterPage
