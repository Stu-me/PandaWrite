import { useContext } from 'react'
import PageTabsContext from '../context/pageTabsContext'

// Provides page-tab state to the editor and its tab bar.
export function usePageTabs() {
  const context = useContext(PageTabsContext)
  if (!context) throw new Error('usePageTabs must be used within PageTabsProvider')
  return context
}
