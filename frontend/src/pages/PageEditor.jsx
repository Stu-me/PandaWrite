import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { pageService } from '../services/pageService'
import { blockService } from '../services/blockService'
import BlockRow from '../components/BlockRow'
import ConfirmModal from '../components/ConfirmModal'
import Icon from '../components/Icon'
import { useBlocksReducer } from '../hooks/useBlocksReducer'
import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { usePageTabs } from '../hooks/usePageTabs'
import PageTabs from '../components/PageTabs'

const BLOCK_TYPES = ['text', 'heading', 'todo', 'image', 'audio', 'youtube', 'document']
const SPOTIFY_STORAGE_KEY = 'pandawrite-spotify-embed-url'
const DEFAULT_SPOTIFY_LINK = 'https://open.spotify.com/track/6xr4S4BNFVaHlwlkYzyj6R?si=467c9c73a03f4201'

function normalizeSpotifyUrl(value) {
  try {
    const url = new URL(value.trim())
    if (url.hostname !== 'open.spotify.com') return ''
    const [resource, id] = url.pathname.split('/').filter(Boolean)
    if (!['track', 'album', 'playlist', 'episode', 'show'].includes(resource) || !id) return ''
    return `https://open.spotify.com/embed/${resource}/${id}`
  } catch {
    return ''
  }
}

function SpotifyPlayer() {
  const storedSpotifyUrl = localStorage.getItem(SPOTIFY_STORAGE_KEY)
  const [spotifyUrl, setSpotifyUrl] = useState(() => storedSpotifyUrl || normalizeSpotifyUrl(DEFAULT_SPOTIFY_LINK))
  const [inputValue, setInputValue] = useState(() => storedSpotifyUrl || DEFAULT_SPOTIFY_LINK)
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const embedUrl = normalizeSpotifyUrl(inputValue)
    if (!embedUrl) {
      setMessage('Paste a Spotify track, album, playlist, or podcast link.')
      return
    }

    localStorage.setItem(SPOTIFY_STORAGE_KEY, embedUrl)
    setSpotifyUrl(embedUrl)
    setInputValue(inputValue.trim())
    setMessage('')
  }

  const handleClear = () => {
    localStorage.removeItem(SPOTIFY_STORAGE_KEY)
    setSpotifyUrl('')
    setInputValue('')
    setMessage('')
  }

  return (
    <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1DB954] text-lg font-bold text-white">♫</span>
        <div><h2 className="font-semibold text-[var(--text-primary)]">Write with music</h2><p className="text-xs text-[var(--text-secondary)]">Keep a Spotify player nearby</p></div>
      </div>
      {spotifyUrl ? <iframe src={spotifyUrl} title="Spotify music player" className="mt-4 h-[352px] w-full rounded-xl border-0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /> : <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">Add a Spotify link to start listening while you write.</div>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <label htmlFor="spotify-link" className="text-xs font-semibold text-[var(--text-primary)]">Spotify link</label>
        <input id="spotify-link" value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder="Paste a Spotify link" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-light)]" />
        {message && <p className="text-xs text-red-500">{message}</p>}
        <div className="flex gap-2"><button type="submit" className="flex-1 rounded-xl bg-[var(--btn-primary-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition hover:bg-[var(--btn-primary-hover)]">Load player</button>{spotifyUrl && <button type="button" onClick={handleClear} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">Clear</button>}</div>
      </form>
    </aside>
  )
}

function PageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useBlocksReducer()
  const { openTab, renameTab } = usePageTabs()
  const { blocks, status } = state
  const blockRefs = useRef({})

  const [page, setPage] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [slashMenuFor, setSlashMenuFor] = useState(null)
  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState(null)

  const fetchPage = useCallback(async () => {
    try {
      const [pageRes, blocksRes] = await Promise.all([
        pageService.getById(id),
        blockService.getAllForPage(id),
      ])
      setPage(pageRes.data)
      // Opening a page from any workspace adds it to the shared editor tab strip.
      openTab({ id: pageRes.data._id, title: pageRes.data.title })
      dispatch({ type: 'SET_BLOCKS', payload: blocksRes.data })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load page')
    } finally {
      setPageLoading(false)
    }
  }, [dispatch, id, openTab])

  useEffect(() => {
    // This starts an asynchronous API request; its state updates happen after it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPage()
  }, [fetchPage])

  const persistBlock = useCallback(async (block) => {
    dispatch({ type: 'SET_STATUS', payload: 'saving' })
    try {
      await blockService.update(block._id, {
        content: block.content,
        type: block.type,
        properties: block.properties || {},
      })
      dispatch({ type: 'SET_STATUS', payload: 'idle' })
    } catch (err) {
      dispatch({ type: 'SET_STATUS', payload: 'error' })
      setError(err.response?.data?.message || 'Failed to save block')
    }
  }, [dispatch])

  const { debouncedSave, cancelSave } = useDebouncedSave(persistBlock, 500)

  const handleContentChange = useCallback((blockId, content) => {
    const block = blocks.find((item) => item._id === blockId)
    if (!block) return

    const updatedBlock = { ...block, content }
    dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id: blockId, content } })
    debouncedSave(blockId, updatedBlock)
  }, [blocks, debouncedSave, dispatch])

  const handleAddBlock = async (type = 'text') => {
    try {
      const res = await blockService.create(id, { type, content: '' })
      dispatch({ type: 'ADD_BLOCK', payload: res.data })
      requestAnimationFrame(() => blockRefs.current[res.data._id]?.focus())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add block')
    }
  }

  const saveOrder = useCallback(async (orderedBlocks) => {
    await blockService.reorder(id, orderedBlocks.map((block) => block._id))
  }, [id])

  const handleAddBlockAfter = async (afterId) => {
    try {
      const res = await blockService.create(id, { type: 'text', content: '' })
      const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
      const afterIndex = orderedBlocks.findIndex((block) => block._id === afterId)
      orderedBlocks.splice(afterIndex + 1, 0, res.data)
      const nextBlocks = orderedBlocks.map((block, index) => ({ ...block, order: index }))

      dispatch({ type: 'REORDER_BLOCKS', payload: nextBlocks })
      await saveOrder(nextBlocks)
      requestAnimationFrame(() => blockRefs.current[res.data._id]?.focus())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add block')
      void fetchPage()
    }
  }

  const handleTypeChange = (block, type) => {
    // Media blocks require a URL or recording, so clear incompatible text when switching types.
    const content = ['image', 'audio', 'youtube', 'document'].includes(type) ? '' : block.content
    const properties = type === 'heading' ? { headingLevel: 'h2', color: 'default' } : type === 'text' ? { textStyle: 'normal', color: 'default' } : {}
    const updatedBlock = { ...block, type, content, properties }
    dispatch({ type: 'UPDATE_BLOCK_TYPE', payload: { id: block._id, type } })
    if (content !== block.content) dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id: block._id, content } })
    dispatch({ type: 'UPDATE_BLOCK_PROPERTIES', payload: { id: block._id, properties } })
    debouncedSave(block._id, updatedBlock)
  }

  // Persists presentation metadata separately so content remains simple searchable text.
  const handlePropertiesChange = (block, properties) => {
    const updatedBlock = { ...block, properties: { ...block.properties, ...properties } }
    dispatch({ type: 'UPDATE_BLOCK_PROPERTIES', payload: { id: block._id, properties: updatedBlock.properties } })
    debouncedSave(block._id, updatedBlock)
  }

  const handleDeleteBlock = async (blockId) => {
    cancelSave(blockId)
    try {
      await blockService.delete(blockId)
      dispatch({ type: 'DELETE_BLOCK', payload: blockId })
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete block')
      return false
    }
  }

  const handleConfirmDeleteBlock = async () => {
    if (!deleteBlockConfirm) return

    const blockId = deleteBlockConfirm
    setDeleteBlockConfirm(null)
    await handleDeleteBlock(blockId)
  }

  const handleDeleteAndFocusPrevious = async (blockId) => {
    const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
    const blockIndex = orderedBlocks.findIndex((block) => block._id === blockId)
    const previousBlock = orderedBlocks[blockIndex - 1]

    if (!previousBlock) return
    if (await handleDeleteBlock(blockId)) {
      requestAnimationFrame(() => blockRefs.current[previousBlock._id]?.focus())
    }
  }

  const handleArrowNav = (blockId, direction) => {
    const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
    const blockIndex = orderedBlocks.findIndex((block) => block._id === blockId)
    const targetBlock = orderedBlocks[blockIndex + (direction === 'up' ? -1 : 1)]
    if (targetBlock) blockRefs.current[targetBlock._id]?.focus()
  }

  const handleSlashSelect = (block, type) => {
    const properties = type === 'heading' ? { headingLevel: 'h2', color: 'default' } : type === 'text' ? { textStyle: 'normal', color: 'default' } : {}
    const updatedBlock = { ...block, type, content: '', properties }
    dispatch({ type: 'UPDATE_BLOCK_TYPE', payload: { id: block._id, type } })
    dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { id: block._id, content: '' } })
    dispatch({ type: 'UPDATE_BLOCK_PROPERTIES', payload: { id: block._id, properties } })
    setSlashMenuFor(null)
    debouncedSave(block._id, updatedBlock)
    requestAnimationFrame(() => blockRefs.current[block._id]?.focus())
  }

  const handleDragStart = (blockId) => {
    dispatch({ type: 'SET_DRAGGED', payload: blockId })
  }

  const handleDrop = async (targetId, draggedId) => {
    if (!draggedId || draggedId === targetId) return

    const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
    const draggedIndex = orderedBlocks.findIndex((block) => block._id === draggedId)
    const targetIndex = orderedBlocks.findIndex((block) => block._id === targetId)
    if (draggedIndex < 0 || targetIndex < 0) return

    const [movedBlock] = orderedBlocks.splice(draggedIndex, 1)
    orderedBlocks.splice(targetIndex, 0, movedBlock)
    const nextBlocks = orderedBlocks.map((block, index) => ({ ...block, order: index }))
    dispatch({ type: 'REORDER_BLOCKS', payload: nextBlocks })

    try {
      await saveOrder(nextBlocks)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order')
      void fetchPage()
    }
  }

  const handleTitleBlur = async (title) => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle || trimmedTitle === page.title) return

    try {
      const res = await pageService.update(id, { title: trimmedTitle })
      setPage(res.data)
      renameTab(id, res.data.title)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update title')
    }
  }

  const handleShare = async () => {
    try {
      const response = await pageService.toggleSharing(id)
      setPage(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update sharing')
    }
  }

  if (pageLoading) return <h1 className="p-6 text-[var(--text-secondary)]">Loading...</h1>
  if (!page) return <h1 className="p-6 text-[var(--text-secondary)]">Page not found</h1>

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <SpotifyPlayer />
        <div className="min-h-screen bg-[var(--bg-card)] p-2 sm:p-4 lg:p-6">
      <PageTabs activePageId={id} />
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition">← Back to dashboard</button>
        <div className="flex items-center gap-3"><button onClick={handleShare} disabled={page.blogStatus === 'suspended'} title={page.isShared ? 'This page is public' : 'This page is private'} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${page.isShared ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'} disabled:cursor-not-allowed disabled:opacity-50`}><Icon name={page.isShared ? 'share' : 'lock'} className="h-3.5 w-3.5" />{page.isShared ? 'Shared' : 'Private'}</button><SaveStatus status={status} /></div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <input
        defaultValue={page.title}
        onBlur={(event) => handleTitleBlur(event.target.value)}
        className="text-4xl font-bold w-full mb-8 outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
      />

      <div className="space-y-2">
        {[...blocks]
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <BlockRow
              key={block._id}
              block={block}
              registerRef={(node) => {
                if (node) blockRefs.current[block._id] = node
                else delete blockRefs.current[block._id]
              }}
              onContentChange={handleContentChange}
              onTypeChange={handleTypeChange}
              onPropertiesChange={handlePropertiesChange}
              onDelete={(blockId) => setDeleteBlockConfirm(blockId)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onAddAfter={handleAddBlockAfter}
              onDeleteAndFocusPrevious={handleDeleteAndFocusPrevious}
              onArrowNav={handleArrowNav}
              slashMenuOpen={slashMenuFor === block._id}
              onSlashOpen={() => setSlashMenuFor(block._id)}
              onSlashClose={() => setSlashMenuFor(null)}
              onSlashSelect={(type) => handleSlashSelect(block, type)}
            />
          ))}
      </div>

      <div className="flex gap-2 mt-8">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => handleAddBlock(type)}
            className="text-xs border border-[var(--border)] rounded-xl px-3 py-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg)] transition"
          >
            + {type}
          </button>
        ))}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteBlockConfirm)}
        title="Delete block?"
        message="Delete this block? This cannot be undone."
        confirmText="Delete block"
        variant="danger"
        onConfirm={handleConfirmDeleteBlock}
        onCancel={() => setDeleteBlockConfirm(null)}
      />
        </div>
      </div>
    </div>
  )
}

function SaveStatus({ status }) {
  if (status === 'saving') return <span className="text-xs text-[var(--text-secondary)]">Saving...</span>
  if (status === 'error') return <span className="text-xs text-red-500">Save failed</span>
  return <span className="text-xs text-[var(--text-muted)]">Saved</span>
}

export default PageEditor
