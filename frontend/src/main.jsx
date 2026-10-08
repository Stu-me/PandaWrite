import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PageTabsProvider } from './context/PageTabsContext.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <SubscriptionProvider>
      <ThemeProvider>
        <PageTabsProvider><App /></PageTabsProvider>
      </ThemeProvider>
    </SubscriptionProvider>
  </AuthProvider>,
)
