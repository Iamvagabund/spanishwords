import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { BlockPage } from './pages/BlockPage'
import { BlockCompletionPage } from './pages/BlockCompletionPage'
import Repeat from './pages/Repeat'
import StatsPage from './pages/StatsPage'
import { Auth } from './components/Auth'
import { ProfilePage } from './pages/ProfilePage'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/auth" />
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        )
      },
      {
        path: 'block/:blockId',
        element: (
          <PrivateRoute>
            <BlockPage />
          </PrivateRoute>
        )
      },
      {
        path: 'block/:blockId/completion',
        element: (
          <PrivateRoute>
            <BlockCompletionPage />
          </PrivateRoute>
        )
      },
      {
        path: 'review',
        element: (
          <PrivateRoute>
            <Repeat />
          </PrivateRoute>
        )
      },
      {
        path: 'stats',
        element: (
          <PrivateRoute>
            <StatsPage />
          </PrivateRoute>
        )
      }
    ]
  }
])

// Створюємо корінь додатку
const root = ReactDOM.createRoot(document.getElementById('root')!)

// Обгортаємо додаток в ThemeProvider
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
