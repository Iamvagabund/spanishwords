import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HomeIcon, ArrowPathIcon, ChartBarIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ArrowPathIcon as ArrowPathIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid'
import { useAuthStore } from '../store/authStore'
import { Profile, Avatar } from './Profile'
import { LanguageSwitcher, useCurrentLanguage } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl shadow-glow" />
      {!compact && <span className="font-display text-xl font-extrabold tracking-tight text-gradient">Слова</span>}
    </span>
  )
}

function pageTitle(pathname: string, langName?: string) {
  if (pathname.startsWith('/profile')) return 'Профіль'
  if (pathname.startsWith('/admin')) return 'Адмінка'
  if (pathname.startsWith('/languages') || pathname === '/') return 'Мови'
  if (pathname.endsWith('/stats')) return 'Статистика'
  if (pathname.endsWith('/completion')) return 'Результат'
  return langName ?? 'Слова'
}

export function Navbar() {
  const user = useAuthStore(s => s.user)
  const { language } = useCurrentLanguage()
  const { pathname } = useLocation()
  const base = language ? `/${language.code}` : '/'

  const links = [
    { to: base, label: 'Головна', icon: HomeIcon, solid: HomeIconSolid, end: true },
    ...(language
      ? [
          { to: `${base}/review`, label: 'Повторення', icon: ArrowPathIcon, solid: ArrowPathIconSolid, end: false },
          { to: `${base}/stats`, label: 'Статистика', icon: ChartBarIcon, solid: ChartBarIconSolid, end: false },
        ]
      : []),
  ]
  const desktopLinks =
    user?.role === 'admin'
      ? [...links, { to: '/admin', label: 'Адмінка', icon: Cog6ToothIcon, solid: Cog6ToothIconSolid, end: false }]
      : links
  const tabs = [...links, { to: '/profile', label: 'Профіль', icon: UserCircleIcon, solid: UserCircleIconSolid, end: false }]

  return (
    <>
      {/* Desktop: floating glass navbar */}
      <header className="sticky top-0 z-40 hidden px-4 pt-4 sm:block">
        <div className="glass mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 rounded-3xl px-3 shadow-soft">
          <Link to={base} className="rounded-2xl px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Основна навігація">
            {desktopLinks.map(({ to, label, icon: Icon, solid: Solid, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
                    isActive ? 'text-white' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      {isActive ? <Solid className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      <span className="hidden md:inline">{label}</span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            {user && <LanguageSwitcher />}
            <ThemeToggle />
            {user ? (
              <Profile />
            ) : (
              <Link to="/auth" className="btn btn-primary py-2">
                Увійти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile: compact top app bar */}
      <header className="glass pt-safe sticky top-0 z-40 border-x-0 border-t-0 sm:hidden">
        <div className="flex h-14 items-center gap-2 px-3">
          {user && language ? <LanguageSwitcher compact /> : <Logo compact />}
          <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{pageTitle(pathname, language?.name)}</h1>
          <ThemeToggle />
          {user && (
            <Link to="/profile" aria-label="Профіль" className="rounded-full transition active:scale-90">
              <Avatar className="h-9 w-9" />
            </Link>
          )}
        </div>
      </header>

      {/* Mobile: bottom tab bar */}
      <nav className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 sm:hidden" aria-label="Мобільна навігація">
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(({ to, label, icon: Icon, solid: Solid, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-transform active:scale-90 ${
                  isActive ? 'text-brand-500 dark:text-brand-300' : 'text-ink-3'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-14 place-items-center">
                    {isActive && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-full bg-brand-500/15"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    {isActive ? <Solid className="relative h-6 w-6" /> : <Icon className="relative h-6 w-6" />}
                  </span>
                  <span className="max-w-full truncate px-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
