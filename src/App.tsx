import { Toaster } from 'sonner'
import AppRouter from '@/shared/router/AppRouter'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()
  return (
    <>
      <Toaster position="top-center" containerAriaLabel={t('common.notifications')} toastOptions={{ closeButtonAriaLabel: t('common.close') }} />
      <AppRouter />
    </>
  )
}

export default App
