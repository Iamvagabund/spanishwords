import { Navigate, NavLink, Outlet, type RouteObject } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { card } from './ui'
import AdminOverview from './Overview'
import AdminContent from './Content'
import AdminUsers from './Users'

const tabs = [
  { to: '/admin', label: 'Огляд', end: true },
  { to: '/admin/content', label: 'Контент', end: false },
  { to: '/admin/users', label: 'Користувачі', end: false },
]

function AdminLayout() {
  const role = useAuthStore((s) => (s.user as { role?: string } | null)?.role)
  const token = useAuthStore((s) => s.token)

  if (!token || role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className={`${card} text-center`}>
          <div className="mb-2 text-4xl">🔒</div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Доступ заборонено</h1>
          <p className="mt-2 text-sm text-zinc-500">Ця сторінка доступна лише адміністраторам.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Адмін-панель</h1>
        <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-400'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}

export const adminRoute: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminOverview /> },
    { path: 'content', element: <AdminContent /> },
    { path: 'users', element: <AdminUsers /> },
    { path: '*', element: <Navigate to="/admin" replace /> },
  ],
}

export default adminRoute
