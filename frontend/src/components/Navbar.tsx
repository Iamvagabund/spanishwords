import { Link, NavLink } from 'react-router-dom'
import {
  HomeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../context/ThemeContext'
import { Profile } from './Profile'
import { LanguageSwitcher, useCurrentLanguage } from './LanguageSwitcher'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'

export function Navbar() {
  const { user } = useAuthStore()
  const { language } = useCurrentLanguage()
  const base = language ? `/${language.code}` : '/'
  const links = [
    { to: base, label: 'Головна', icon: HomeIcon, end: true },
    ...(language
      ? [
          { to: `${base}/review`, label: 'Повторення', icon: ArrowPathIcon, end: false },
          { to: `${base}/stats`, label: 'Статистика', icon: ChartBarIcon, end: false },
        ]
      : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Адмінка', icon: Cog6ToothIcon, end: false }] : []),
  ]
  const { theme, toggleTheme } = useTheme()
  const themeLabel = theme === 'dark' ? 'Світла тема' : 'Темна тема'

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to={base} className={`flex min-w-0 items-center gap-2.5 rounded-xl ${focusRing}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              {language?.flag ?? 'W'}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {language ? `${language.name}: слова` : 'Вивчаємо слова'}
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {language?.nativeName ?? 'Оберіть мову'}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Основна навігація">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${focusRing} ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            {user && <LanguageSwitcher />}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className={`grid h-10 w-10 place-items-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${focusRing}`}
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            {user ? (
              <Profile />
            ) : (
              <Link
                to="/auth"
                className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 sm:px-4 ${focusRing}`}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Увійти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:hidden"
        aria-label="Мобільна навігація"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${focusRing} ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
