import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { pageService } from '../services/pageService'

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(value))
function youtubeEmbed(value) { try { const url = new URL(value); const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v'); return id ? `https://www.youtube-nocookie.com/embed/${id}` : '' } catch { return '' } }

function PublicBlock({ block }) {
  if (block.type === 'heading') return <h2 className="mt-10 text-center font-serif text-3xl font-bold leading-tight text-[var(--text-primary)]">{block.content}</h2>
  if (block.type === 'todo') return <p className="my-3 flex gap-3 text-lg text-[var(--text-primary)]"><span>☐</span>{block.content}</p>
  if (block.type === 'image') return <img className="my-8 max-h-[32rem] w-full rounded-xl object-contain" src={block.content} alt="Blog illustration" />
  if (block.type === 'audio') return <audio className="my-6 w-full" controls src={block.content} />
  if (block.type === 'document') return <a href={block.content} target="_blank" rel="noreferrer" className="my-6 flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-4 font-semibold text-[var(--accent)] hover:bg-[var(--bg-hover)]"><span>{block.properties?.fileName || 'Open attached document'}</span><span>Open PDF / DOCX ↗</span></a>
  if (block.type === 'youtube') { const src = youtubeEmbed(block.content); return src ? <iframe className="my-8 aspect-video w-full rounded-xl" src={src} title="Embedded YouTube video" allowFullScreen /> : null }
  const style = block.properties?.textStyle || 'normal'
  if (style === 'quote') return <blockquote className="my-7 border-l-4 border-[var(--accent)] pl-5 text-xl italic leading-8 text-[var(--text-primary)]">“{block.content}”</blockquote>
  if (style === 'code') return <pre className="my-7 overflow-x-auto rounded-xl bg-[var(--bg-hover)] p-4 text-sm text-[var(--text-primary)]"><code>{block.content}</code></pre>
  if (style === 'callout') return <p className="my-7 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--accent-light)] p-4 text-lg text-[var(--text-primary)]">{block.content}</p>
  return <p className={`my-5 text-lg leading-8 text-[var(--text-primary)] ${style === 'italic' ? 'italic' : ''}`}>{block.content}</p>
}

function BlogPostPage() {
  const { id } = useParams(); const [data, setData] = useState(null); const [error, setError] = useState('')
  useEffect(() => { pageService.getPublicBlog(id).then((response) => setData(response.data)).catch(() => setError('This story is unavailable.')) }, [id])
  if (error) return <main className="min-h-screen p-10 text-center text-[var(--text-secondary)]"><Link to="/blog" className="text-[var(--accent)]">← Back to stories</Link><p className="mt-8">{error}</p></main>
  if (!data) return <main className="min-h-screen p-10 text-center text-[var(--text-secondary)]">Loading story…</main>
  return <main className="min-h-screen bg-[var(--bg)] px-5 py-10 sm:px-8"><article className="mx-auto max-w-3xl"><Link to="/blog" className="text-sm font-semibold text-[var(--accent)] hover:underline">← All stories</Link><header className="border-b border-[var(--border)] py-10"><p className="text-sm text-[var(--text-secondary)]">{data.page.createdBy?.name || 'Pandawrite writer'} · {formatDate(data.page.updatedAt)}</p><h1 className="mt-4 text-center font-serif text-5xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-6xl">{data.page.title}</h1></header><div className="py-8">{data.blocks.map((block) => <PublicBlock key={block._id} block={block} />)}</div></article></main>
}

export default BlogPostPage
