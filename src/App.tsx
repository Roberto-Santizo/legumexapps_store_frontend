import { Toaster } from 'sonner'
import AppRouter from '@/shared/router/AppRouter'

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AppRouter />
    </>
  )
}

export default App
