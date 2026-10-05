import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { UserCircleIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

export function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const name = user?.nickname || user?.email || 'U'
  const avatar =
    user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      active ? 'bg-zinc-100 dark:bg-zinc-800' : ''
    }`

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:hover:bg-zinc-800 sm:pr-2">
        <span className="relative">
          <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
        </span>
        {user?.nickname && (
          <span className="hidden max-w-[8rem] truncate text-sm font-medium text-zinc-700 dark:text-zinc-200 md:block">
            {user.nickname}
          </span>
        )}
        <ChevronDownIcon className="hidden h-4 w-4 text-zinc-500 dark:text-zinc-400 sm:block" />
        <span className="sr-only">Меню профілю</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user?.nickname || 'Профіль'}</p>
            {user?.email && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>}
          </div>
          <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <Menu.Item>
            {({ active }) => (
              <Link to="/profile" className={`${itemClass(active)} text-zinc-700 dark:text-zinc-200`}>
                <UserCircleIcon className="h-5 w-5" />
                Профіль
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button type="button" onClick={handleLogout} className={`${itemClass(active)} text-rose-600 dark:text-rose-400`}>
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                Вийти
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
