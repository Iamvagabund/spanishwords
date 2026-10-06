import { Fragment, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dialog, Menu, Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useContentStore } from '../store/contentStore'
import { useAuthStore } from '../store/authStore'
import { languageTone } from '../theme/palette'
import type { Language } from '../types'

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

function LangRow({ l, current, hover }: { l: Language; current: boolean; hover?: boolean }) {
  const tone = languageTone(l.code)
  return (
    <span
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
        current ? `${tone.soft}` : hover ? 'bg-surface-2' : ''
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone.gradient} text-2xl shadow-soft`} aria-hidden>
        {l.flag}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-ink">{l.name}</span>
        <span className="block truncate text-xs text-ink-3">{l.nativeName}</span>
      </span>
      {current && <CheckCircleIcon className={`h-6 w-6 shrink-0 ${tone.text}`} />}
    </span>
  )
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, inLangRoute, rest, languages } = useCurrentLanguage()
  const setSelectedLanguage = useAuthStore(s => s.setSelectedLanguage)
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(false)

  if (languages.length === 0) return null

  const choose = (code: string) => {
    setSheet(false)
    void setSelectedLanguage(code)
    navigate(`/${code}${inLangRoute ? sectionFor(rest) : ''}`)
  }

  const flag = language ? (
    <span className="text-2xl leading-none" aria-hidden>
      {language.flag}
    </span>
  ) : (
    <GlobeAltIcon className="h-5 w-5" />
  )

  // Mobile: opens a bottom sheet
  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label="Змінити мову"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-2 transition active:scale-90"
        >
          {flag}
        </button>
        <Transition show={sheet} as={Fragment}>
          <Dialog onClose={setSheet} className="relative z-50">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-x-0 bottom-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
              >
                <Dialog.Panel className="pb-safe rounded-t-4xl border-t border-line bg-surface px-4 pt-3 shadow-lift">
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
                  <Dialog.Title className="mb-3 px-1 font-display text-xl font-extrabold">Мова навчання</Dialog.Title>
                  <div className="space-y-1.5">
                    {languages.map(l => (
                      <button key={l.code} type="button" onClick={() => choose(l.code)} className="block w-full active:scale-[.98]">
                        <LangRow l={l} current={l.code === language?.code} />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSheet(false)
                      navigate('/languages')
                    }}
                    className="btn btn-secondary mb-4 mt-4 w-full"
                  >
                    <GlobeAltIcon className="h-5 w-5" /> Усі мови
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </>
    )
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex h-11 items-center gap-1.5 rounded-2xl px-2.5 text-ink-2 transition hover:bg-surface-2 hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        aria-label="Змінити мову"
        title="Змінити мову"
      >
        {flag}
        <span className="hidden text-sm font-bold uppercase lg:inline">{language?.code}</span>
        <ChevronDownIcon className="h-4 w-4" />
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
        <Menu.Items className="card absolute right-0 z-50 mt-3 w-72 origin-top-right p-2 shadow-lift focus:outline-none">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-3">Мова навчання</p>
          {languages.map(l => (
            <Menu.Item key={l.code}>
              {({ active }) => (
                <button type="button" onClick={() => choose(l.code)} className="block w-full">
                  <LangRow l={l} current={l.code === language?.code} hover={active} />
                </button>
              )}
            </Menu.Item>
          ))}
          <div className="my-1 h-px bg-line" />
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={() => navigate('/languages')}
                className={`flex min-h-[44px] w-full items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-ink-2 ${
                  active ? 'bg-surface-2' : ''
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
