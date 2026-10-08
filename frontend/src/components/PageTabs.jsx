import { useNavigate } from 'react-router-dom'
import { usePageTabs } from '../hooks/usePageTabs'
import Icon from './Icon'

// Renders a horizontally scrollable VS Code-style strip of currently opened pages.
function PageTabs({ activePageId }) {
  const { tabs, closeTab } = usePageTabs()
  const navigate = useNavigate()
  // Closes a tab and routes to the adjacent tab, or returns to the dashboard when no tab remains.
  const handleClose = (event, tabId) => { event.stopPropagation(); const nextTab = closeTab(tabId); if (tabId === activePageId) navigate(nextTab ? `/page/${nextTab.id}` : '/dashboard', { replace: true }) }
  if (!tabs.length) return null
  return <div className="-mx-2 mb-5 flex overflow-x-auto border-b border-[var(--border)] px-2"><div className="flex min-w-max">{tabs.map((tab) => <button key={tab.id} onClick={() => navigate(`/page/${tab.id}`)} className={`group flex max-w-52 items-center gap-2 border-r border-[var(--border)] px-3 py-2.5 text-sm ${tab.id === activePageId ? 'bg-[var(--bg)] font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}><Icon name="file" className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{tab.title || 'Untitled'}</span><span role="button" tabIndex={0} onClick={(event) => handleClose(event, tab.id)} onKeyDown={(event) => event.key === 'Enter' && handleClose(event, tab.id)} className="rounded p-0.5 opacity-0 hover:bg-[var(--border-light)] group-hover:opacity-100" aria-label={`Close ${tab.title}`}><Icon name="close" className="h-3.5 w-3.5" /></span></button>)}</div></div>
}

export default PageTabs
