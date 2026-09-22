import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import '@/shared/i18n/i18n'
import { queryClient } from '@/shared/query/queryClient'
import { AuthProvider } from '@/shared/auth/AuthContext'
import { SalespersonAuthProvider } from '@/shared/auth/salesperson/SalespersonAuthContext'
import { ErrorBoundary } from '@/shared/component/errorBoundary.component'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SalespersonAuthProvider>
              <App />
            </SalespersonAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
