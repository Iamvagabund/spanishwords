import { Navigate, NavLink, Outlet, type RouteObject } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { card } from './ui'
import AdminOverview from './Overview'
import AdminContent from './Content'
import AdminUsers from './Users'

const tabs = [
  { to: '/admin', label: 'Огляд', icon: '📊', end: true },
  { to: '/admin/content', label: 'Контент', icon: '📚', end: false },
  { to: '/admin/users', label: 'Користувачі', icon: '👥', end: false },
]

function AdminLayout() {
  const role = useAuthStore((s) => (s.user as { role?: string } | null)?.role)
  const token = useAuthStore((s) => s.token)

  if (!token || role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className={`${card} text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-3xl">🔒</div>
          <h1 className="text-xl font-bold text-ink">Доступ заборонено</h1>
          <p className="mt-2 text-sm text-ink-2">Ця сторінка доступна лише адміністраторам.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:pb-10 sm:pt-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-glow">
            🛠️
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Адмін-<span className="text-gradient">панель</span>
            </h1>
            <p className="text-sm text-ink-3">Керування мовами, блоками та учнями</p>
          </div>
        </div>
        <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-line/70 bg-surface-2 p-1 lg:w-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-sm font-bold transition active:scale-95 sm:px-4 ${
                  isActive ? 'bg-surface text-brand-600 shadow-soft dark:text-brand-300' : 'text-ink-2 hover:text-ink'
                }`
              }
            >
              <span className="hidden min-[400px]:inline">{t.icon}</span>
              <span className="truncate">{t.label}</span>
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
