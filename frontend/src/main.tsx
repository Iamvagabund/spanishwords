import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import { BlockPage } from './pages/BlockPage'
import { BlockCompletionPage } from './pages/BlockCompletionPage'
import Repeat from './pages/Repeat'
import StatsPage from './pages/StatsPage'
import LanguagePicker from './pages/LanguagePicker'
import { Auth } from './components/Auth'
import { ProfilePage } from './pages/ProfilePage'
import { LangGuard } from './context/LangContext'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './context/ThemeContext'
import { adminRoute } from './pages/admin'
import './index.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function RootRedirect() {
  const selected = useAuthStore(s => s.user?.selectedLanguage)
  return selected ? <Navigate to={`/${selected}`} replace /> : <LanguagePicker />
}

const router = createBrowserRouter([
  { path: '/auth', element: <Auth /> },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'languages', element: <LanguagePicker /> },
      { path: 'profile', element: <ProfilePage /> },
      adminRoute,
      {
        path: ':lang',
        element: <LangGuard />,
        children: [
          { index: true, element: <Home /> },
          { path: 'block/:order', element: <BlockPage /> },
          { path: 'block/:order/completion', element: <BlockCompletionPage /> },
          { path: 'review', element: <Repeat /> },
          { path: 'stats', element: <StatsPage /> },
        ],
      },
      { path: '*', element: <LanguagePicker /> },
    ],
  },
])

// Validate the persisted session and pull server progress (cached progress shows instantly).
void useAuthStore.getState().checkAuth()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
