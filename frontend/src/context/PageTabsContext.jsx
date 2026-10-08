import { useCallback, useState } from 'react'
import PageTabsContext from './pageTabsContext'

const STORAGE_KEY = 'pandawrite-open-page-tabs'

// Restores valid open tabs for the current browser session without sharing them across devices.
function getSavedTabs() {
  try { const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(saved) ? saved : [] } catch { return [] }
}

// Keeps page-editor tabs available while users move across dashboards and workspaces.
export function PageTabsProvider({ children }) {
  const [tabs, setTabs] = useState(getSavedTabs)
  const saveTabs = useCallback((nextTabs) => { setTabs(nextTabs); sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTabs)) }, [])
  // Adds a page once or refreshes its title when it is opened again.
  const openTab = useCallback((page) => { setTabs((current) => { const next = [...current.filter((tab) => tab.id !== page.id), { id: page.id, title: page.title }]; sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next }) }, [])
  // Removes one tab and returns the most suitable next page for the caller to navigate to.
  const closeTab = useCallback((pageId) => { const index = tabs.findIndex((tab) => tab.id === pageId); const nextTabs = tabs.filter((tab) => tab.id !== pageId); saveTabs(nextTabs); return nextTabs[index] || nextTabs[index - 1] || null }, [saveTabs, tabs])
  // Updates the visible tab title after a page title edit.
  const renameTab = useCallback((pageId, title) => saveTabs(tabs.map((tab) => tab.id === pageId ? { ...tab, title } : tab)), [saveTabs, tabs])
  return <PageTabsContext.Provider value={{ tabs, openTab, closeTab, renameTab }}>{children}</PageTabsContext.Provider>
}
