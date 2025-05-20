import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { BlockPage } from './pages/BlockPage'
import { BlockCompletionPage } from './pages/BlockCompletionPage'
import Repeat from './pages/Repeat'
import { StatsPage } from './pages/StatsPage'
import { Settings } from './pages/Settings'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'block/:blockId',
        element: <BlockPage />
      },
      {
        path: 'block/:blockId/completion',
        element: <BlockCompletionPage />
      },
      {
        path: 'review',
        element: <Repeat />
      },
      {
        path: 'stats',
        element: <StatsPage />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
