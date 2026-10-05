import { Fragment, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useContentStore } from '../store/contentStore'
import { useAuthStore } from '../store/authStore'

/** Language from the first URL segment (works outside the `/:lang` route, e.g. in the Navbar). */
export function useCurrentLanguage() {
  const { pathname } = useLocation()
  const languages = useContentStore(s => s.languages)
  const loadLanguages = useContentStore(s => s.loadLanguages)
  const selected = useAuthStore(s => s.user?.selectedLanguage)

  useEffect(() => {
    void loadLanguages()
  }, [loadLanguages])

  const [, first = '', ...rest] = pathname.split('/')
  const fromUrl = languages.find(l => l.code === first.toLowerCase())
  // Outside /:lang (e.g. /profile) fall back to the saved language so nav links keep working.
  const language = fromUrl ?? languages.find(l => l.code === selected)
  return { language, inLangRoute: !!fromUrl, rest, languages }
}

/** Section of the current URL that exists in every language. */
function sectionFor(rest: string[]): string {
  const [section] = rest
  if (section === 'review' || section === 'stats') return `/${section}`
  return '' // block pages differ per language -> go to that language's home
}

export function LanguageSwitcher() {
  const { language, inLangRoute, rest, languages } = useCurrentLanguage()
  const setSelectedLanguage = useAuthStore(s => s.setSelectedLanguage)
  const navigate = useNavigate()

  if (languages.length === 0) return null

  const choose = (code: string) => {
    void setSelectedLanguage(code)
    navigate(`/${code}${inLangRoute ? sectionFor(rest) : ''}`)
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Змінити мову"
        title="Змінити мову"
      >
        {language ? (
          <span className="text-xl leading-none" aria-hidden>
            {language.flag}
          </span>
        ) : (
          <GlobeAltIcon className="h-5 w-5" />
        )}
        <span className="hidden text-sm font-medium uppercase md:inline">{language?.code}</span>
        <ChevronDownIcon className="h-4 w-4" />
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
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Мова навчання</p>
          {languages.map(l => {
            const active = l.code === language?.code
            return (
              <Menu.Item key={l.code}>
                {({ active: hover }) => (
                  <button
                    type="button"
                    onClick={() => choose(l.code)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      hover ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    } ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-200'}`}
                  >
                    <span className="text-xl leading-none" aria-hidden>
                      {l.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{l.name}</span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{l.nativeName}</span>
                    </span>
                    {active && <CheckIcon className="h-4 w-4 shrink-0" />}
                  </button>
                )}
              </Menu.Item>
            )
          })}
          <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <Menu.Item>
            {({ active: hover }) => (
              <button
                type="button"
                onClick={() => navigate('/languages')}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 ${
                  hover ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                }`}
              >
                <GlobeAltIcon className="h-5 w-5" /> Усі мови
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
