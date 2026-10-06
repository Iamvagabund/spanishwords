import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { UserCircleIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

/** User avatar: uploaded image or a gradient initial. */
export function Avatar({ className = 'h-9 w-9' }: { className?: string }) {
  const user = useAuthStore(s => s.user)
  const name = user?.nickname || user?.email || 'U'
  if (user?.avatar)
    return <img src={user.avatar} alt="" className={`${className} rounded-full object-cover ring-2 ring-brand-500/40`} />
  return (
    <span className={`${className} grid place-items-center rounded-full bg-brand-gradient text-sm font-extrabold uppercase text-white ring-2 ring-white/20`}>
      {name.trim().charAt(0)}
    </span>
  )
}

export function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const item = (active: boolean) =>
    `flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-ink transition ${active ? 'bg-surface-2' : ''}`

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-full p-1 transition hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 lg:pr-3">
        <span className="relative">
          <Avatar />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
        </span>
        {user?.nickname && <span className="hidden max-w-[8rem] truncate text-sm font-bold lg:block">{user.nickname}</span>}
        <span className="sr-only">Меню профілю</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 -translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="card absolute right-0 z-50 mt-3 w-64 origin-top-right p-2 shadow-lift focus:outline-none">
          <div className="mb-1 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <Avatar className="h-11 w-11" />
            <div className="min-w-0">
              <p className="truncate font-bold">{user?.nickname || 'Профіль'}</p>
              {user?.email && <p className="truncate text-xs text-ink-3">{user.email}</p>}
            </div>
          </div>
          <Menu.Item>
            {({ active }) => (
              <Link to="/profile" className={item(active)}>
                <UserCircleIcon className="h-5 w-5 text-brand-500" /> Профіль
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link to="/languages" className={item(active)}>
                <GlobeAltIcon className="h-5 w-5 text-sky-500" /> Усі мови
              </Link>
            )}
          </Menu.Item>
          {user?.role === 'admin' && (
            <Menu.Item>
              {({ active }) => (
                <Link to="/admin" className={item(active)}>
                  <Cog6ToothIcon className="h-5 w-5 text-amber-500" /> Адмінка
                </Link>
              )}
            </Menu.Item>
          )}
          <div className="my-1 h-px bg-line" />
          <Menu.Item>
            {({ active }) => (
              <button type="button" onClick={handleLogout} className={`${item(active)} !text-rose-500`}>
                <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Вийти
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
