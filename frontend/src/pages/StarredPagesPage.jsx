import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageService } from '../services/pageService'
import Icon from '../components/Icon'

// Displays only pages personally marked important by the signed-in user.
function StarredPagesPage() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Fetches the small starred collection independently of a workspace filter.
  const loadStarredPages = useCallback(async () => {
    try {
      const response = await pageService.getStarred()
      setPages(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load starred pages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The API response changes state asynchronously after the component renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStarredPages()
  }, [loadStarredPages])

  // Removes a page from this focused list while keeping the page itself intact.
  const removeStar = async (pageId) => {
    try {
      await pageService.toggleStar(pageId)
      setPages((currentPages) => currentPages.filter((page) => page._id !== pageId))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the starred page')
    }
  }

  if (loading) return <main className="min-h-screen p-6 text-[var(--text-secondary)]">Loading starred pages...</main>

  return <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-6"><div className="mx-auto max-w-6xl"><header className="mb-8"><p className="text-sm font-semibold text-[var(--gold)]">QUICK ACCESS</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)]"><Icon name="star" className="h-7 w-7 fill-current text-[var(--gold)]" />Starred pages</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Your most important pages, all in one place.</p></header>{error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{pages.length === 0 ? <section className="grid min-h-72 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--gold-light)] text-[var(--gold)]"><Icon name="star" /></span><h2 className="mt-4 font-semibold text-[var(--text-primary)]">No starred pages yet</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Hover over a page card and click its star to keep it here.</p></div></section> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pages.map((page) => <article key={page._id} className="group relative rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"><button onClick={() => navigate(`/page/${page._id}`)} className="w-full text-left"><Icon name="file" className="mb-7 h-5 w-5 text-[var(--accent)]" /><h2 className="truncate font-semibold text-[var(--text-primary)]">{page.title}</h2><p className="mt-2 text-xs text-[var(--text-secondary)]">Updated {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(page.updatedAt))}</p></button><button onClick={() => removeStar(page._id)} className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--gold)] hover:bg-[var(--gold-light)]" aria-label="Remove from starred pages"><Icon name="star" className="h-4 w-4 fill-current" /></button></article>)}</section>}</div></main>
}

export default StarredPagesPage
