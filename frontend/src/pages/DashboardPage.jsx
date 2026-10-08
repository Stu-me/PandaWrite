import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { workspaceService } from '../services/workspaceService'
import { pageService } from '../services/pageService'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/Icon'

function DashboardPage() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [pages, setPages] = useState([])

  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newPageTitle, setNewPageTitle] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const selectWorkspace = useCallback(async (workspace) => {
    setActiveWorkspace(workspace)
    try {
      const res = await pageService.getAll(workspace._id)
      setPages(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pages')
    }
  }, [])

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await workspaceService.getAll()   // was: api.get('/api/workspaces')
      setWorkspaces(res.data)
      if (res.data.length > 0) {
        await selectWorkspace(res.data[0])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [selectWorkspace])

  // NOTE: assumes GET /api/pages returns pages for the logged-in user,
  // and each page has a `workspace` field you can filter on client-side.
  // If your backend supports GET /api/pages?workspace=<id>, swap this to use that instead — cleaner.
  useEffect(() => {
    // This starts an asynchronous API request; its state updates happen after it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWorkspaces()
  }, [fetchWorkspaces])

  const handleCreateWorkspace = async (e) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    try {
      const res = await workspaceService.create({ name: newWorkspaceName })   // was: api.post(...)
      setWorkspaces([...workspaces, res.data])
      setNewWorkspaceName('')
      selectWorkspace(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace')
    }
  }

  const handleDeleteWorkspace = async (id) => {
    try {
      await workspaceService.delete(id)   // was: api.delete(...)
      const updated = workspaces.filter((w) => w._id !== id)
      setWorkspaces(updated)
      if (activeWorkspace?._id === id) {
        setActiveWorkspace(null)
        setPages([])
        if (updated.length > 0) selectWorkspace(updated[0])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workspace')
    }
  }

  const handleCreatePage = async (e) => {
    e.preventDefault()
    if (!newPageTitle.trim() || !activeWorkspace) return

    try {
      const res = await pageService.create({
        title: newPageTitle,
        workspace: activeWorkspace._id,
      })
      setPages([...pages, res.data])
      setNewPageTitle('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create page')
    }
  }

  const handleDeletePage = async (id) => {
    try {
      await pageService.delete(id)
      setPages(pages.filter((p) => p._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete page')
    }
  }

  // Creates and opens a page directly from a workspace so users do not need an extra navigation step.
  const handleQuickCreatePage = async (workspace) => {
    try {
      const response = await pageService.create({ title: 'Untitled page', workspace: workspace._id })
      if (workspace._id === activeWorkspace?._id) setPages((currentPages) => [...currentPages, response.data])
      navigate(`/page/${response.data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create a page in this workspace')
    }
  }

  // Updates the saved/starred state immediately so the dashboard feels responsive.
  const handleToggleStar = async (pageId) => {
    try {
      const response = await pageService.toggleStar(pageId)
      setPages((currentPages) => currentPages.map((page) => page._id === pageId ? response.data : page))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the starred page')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    const { type, id } = deleteConfirm
    setDeleteConfirm(null)

    if (type === 'workspace') {
      await handleDeleteWorkspace(id)
      return
    }

    await handleDeletePage(id)
  }

  if (loading) return <h1 className="p-6 text-[var(--text-secondary)]">Loading...</h1>

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-[var(--accent)]">YOUR WORKSPACE</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--text-primary)]">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Choose a workspace, then create and organize your pages.</p></div>
          <Link to="/subscribe" className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)]">Manage subscription</Link>
        </header>
      
      <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] md:flex-row">

        {/* Sidebar — workspaces */}
        <aside className="w-full shrink-0 border-b border-[var(--border)] bg-[var(--bg-card)] p-4 md:w-64 md:border-r md:border-b-0">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><Icon name="folder" className="h-4 w-4 text-[var(--accent)]" />Workspaces</h2>

          <form onSubmit={handleCreateWorkspace} className="mb-4">
            <input
              type="text"
              placeholder="New workspace"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full p-2 text-sm border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition mb-2"
            />
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--btn-primary-bg)] py-2 text-sm font-semibold text-[var(--text-on-accent)] hover:bg-[var(--btn-primary-hover)]">
              <Icon name="plus" className="h-4 w-4" />Add workspace
            </button>
          </form>

          <ul className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-1">
            {workspaces.map((ws) => (
              <li
                key={ws._id}
                className={`flex shrink-0 justify-between items-center px-3 py-2 rounded-lg cursor-pointer text-sm transition md:w-full ${
                  activeWorkspace?._id === ws._id ? 'bg-[var(--accent-light)] font-medium text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span onClick={() => selectWorkspace(ws)} className="flex-1">
                  {ws.name}
                </span>
                <button
                  onClick={() => handleQuickCreatePage(ws)}
                  className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                  aria-label={`Create page in ${ws.name}`}
                  title="New page"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({
                    type: 'workspace',
                    id: ws._id,
                    title: 'Delete workspace?',
                    message: 'Delete this workspace? This cannot be undone.',
                    confirmText: 'Delete workspace',
                    variant: 'danger',
                  })}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] text-xs ml-2 transition"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main — pages */}
        <div className="min-w-0 flex-1 p-5 sm:p-8">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {!activeWorkspace ? (
            <div className="grid min-h-72 place-items-center text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><Icon name="folder" /></span><h2 className="mt-4 font-semibold text-[var(--text-primary)]">Create your first workspace</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Workspaces keep related pages together.</p></div></div>
          ) : (
            <>
              <div className="mb-6"><p className="text-sm font-medium text-[var(--text-secondary)]">WORKSPACE</p><h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{activeWorkspace.name}</h2></div>

              <form onSubmit={handleCreatePage} className="flex gap-2 mb-8">
                <input
                  type="text"
                  placeholder="New page title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="flex-1 p-2.5 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)] transition bg-[var(--bg-card)]"
                />
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)]">
                  <Icon name="plus" className="h-4 w-4" />Page
                </button>
              </form>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {pages.map((page) => (
                  <article
                    key={page._id}
                    className="border border-[var(--border)] rounded-xl bg-[var(--bg-card)] p-5 hover:shadow-[var(--shadow-card)] cursor-pointer relative transition group"
                  >
                    <div onClick={() => navigate(`/page/${page._id}`)}>
                      <Icon name="file" className="mb-5 h-5 w-5 text-[var(--accent)]" />
                      <p className="font-medium text-[var(--text-primary)]">{page.title}</p>
                    </div>
                    <button
                      onClick={() => handleToggleStar(page._id)}
                      className={`absolute top-3 right-10 rounded p-1.5 text-xs transition ${page.isStarred ? 'text-[var(--gold)] opacity-100' : 'text-[var(--text-secondary)] opacity-0 hover:text-[var(--gold)] group-hover:opacity-100'}`}
                      aria-label={page.isStarred ? 'Remove from starred pages' : 'Add to starred pages'}
                    >
                      <Icon name="star" className={`h-4 w-4 ${page.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({
                        type: 'page',
                        id: page._id,
                        title: 'Delete page?',
                        message: 'Delete this page? This cannot be undone.',
                        confirmText: 'Delete page',
                        variant: 'danger',
                      })}
                      className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--accent)] text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </article>
                ))}
              </div>

              {pages.length === 0 && (
                <p className="text-[var(--text-secondary)] text-sm">No pages yet in this workspace.</p>
              )}
            </>
          )}
        </div>
      </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        title={deleteConfirm?.title || 'Confirm action'}
        message={deleteConfirm?.message || ''}
        confirmText={deleteConfirm?.confirmText || 'Confirm'}
        variant={deleteConfirm?.variant || 'danger'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

export default DashboardPage
