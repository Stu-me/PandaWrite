import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Toast from './Toast'
import ThemeToggle from './ThemeToggle'
import Icon from './Icon'
import UserAvatar from './UserAvatar'
import pandaLogo from '../assets/KungFuPanda.jpg'

// Reads and clears a one-time message saved before navigation, such as login feedback.
function getSavedToast() {
  try { const saved = sessionStorage.getItem('appToast'); sessionStorage.removeItem('appToast'); return saved ? JSON.parse(saved) : null } catch { return null }
}

// Renders the responsive product navigation and keeps account actions inside a compact profile menu.
function Navbar() {
  const { user, logout } = useAuth()
  const [toast, setToast] = useState(getSavedToast)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  // Keeps primary product pages visible in the desktop and mobile taskbar.
  const links = [{ to: '/dashboard', label: 'Dashboard' }, { to: '/blog', label: 'Stories' }, { to: '/subscribe', label: 'Subscription' }, { to: '/about', label: 'About' }]
  if (user?.role === 'masterAdmin') links.push({ to: '/admin/payments', label: 'Admin' }, { to: '/admin/blogs', label: 'Moderate blogs' })
  const linkClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`

  return <>
    <Toast toast={toast} onDismiss={() => setToast(null)} />
    <nav className="sticky top-0 z-30 border-b border-[var(--nav-border)] bg-[var(--bg-nav)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-[var(--text-primary)]"><img src={pandaLogo} alt="Pandawrite" className="h-8 w-8 rounded-lg object-cover" /><span>Pandawrite</span></Link>
        <div className="hidden items-center gap-1 md:flex">{links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}</div>
        <div className="flex items-center gap-2"><ThemeToggle />
          <div className="relative hidden sm:block"><button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-[var(--bg-hover)]" aria-expanded={profileOpen}><UserAvatar name={user?.name} className="h-8 w-8" /><Icon name="chevronDown" className="h-4 w-4 text-[var(--text-secondary)]" /></button>{profileOpen && <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-[var(--shadow-elevated)]"><div className="border-b border-[var(--border)] px-2 pb-3 pt-1"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p><p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{user?.email}</p></div><Link onClick={() => setProfileOpen(false)} to="/starred" className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--gold-light)] hover:text-[var(--gold)]"><Icon name="star" className="h-4 w-4" />Starred pages</Link><div className="mt-2 border-t border-[var(--border)] pt-2"><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><Icon name="logout" className="h-4 w-4" />Log out</button></div></div>}</div>
          <button onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] md:hidden" aria-label="Toggle menu"><Icon name={mobileOpen ? 'close' : 'menu'} /></button>
        </div>
      </div>
      {mobileOpen && <div className="border-t border-[var(--border)] px-4 py-3 md:hidden"><div className="flex flex-col gap-1">{links.map((link) => <NavLink key={link.to} onClick={() => setMobileOpen(false)} to={link.to} className={linkClass}>{link.label}</NavLink>)}<Link onClick={() => setMobileOpen(false)} to="/starred" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--gold-light)] hover:text-[var(--gold)]"><Icon name="star" className="h-4 w-4" />Starred pages</Link><button onClick={logout} className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm font-semibold text-red-700"><Icon name="logout" className="h-4 w-4" />Log out</button></div></div>}
    </nav>
  </>
}

export default Navbar
