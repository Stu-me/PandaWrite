import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pageService } from '../services/pageService'

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

function BlogPage() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { pageService.getPublicBlogs().then((response) => setPosts(response.data)).catch(() => setError('Unable to load stories right now.')) }, [])

  return <main className="min-h-screen bg-[var(--bg)] px-5 py-12 sm:px-8"><div className="mx-auto max-w-5xl"><header className="border-b border-[var(--border)] pb-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[var(--accent)]">Pandawrite stories</p><h1 className="mt-3 font-serif text-5xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl">Ideas worth sharing.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">A calm reading space for pages published by the Pandawrite community.</p></header>{error && <p className="mt-8 text-sm text-red-600">{error}</p>}<section className="divide-y divide-[var(--border)]">{posts.map((post) => <article key={post._id} className="py-8 sm:py-10"><p className="text-sm font-medium text-[var(--text-secondary)]">{post.createdBy?.name || 'Pandawrite writer'} · {formatDate(post.updatedAt)}</p><Link to={`/blog/${post._id}`} className="mt-3 block font-serif text-3xl font-bold leading-tight text-[var(--text-primary)] hover:text-[var(--accent)] sm:text-4xl">{post.title}</Link><Link to={`/blog/${post._id}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)] hover:underline">Read story →</Link></article>)}</section>{!error && posts.length === 0 && <p className="py-16 text-center text-[var(--text-secondary)]">No shared stories yet.</p>}</div></main>
}

export default BlogPage
