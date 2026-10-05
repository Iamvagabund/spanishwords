import { Fragment, createContext, useContext, useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import type { Block, Language } from '../types'
import { useContentStore } from '../store/contentStore'
import { useAuthStore } from '../store/authStore'
import { ErrorState, PageSkeleton } from '../components/LoadState'
import LanguagePicker from '../pages/LanguagePicker'

interface LangContextValue {
  code: string
  language: Language
  blocks: Block[]
}

const LangContext = createContext<LangContextValue | null>(null)

/** Current language + its blocks. Only usable inside the `/:lang` route. */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangGuard>')
  return ctx
}

/** Optional variant for components rendered outside the `/:lang` route (e.g. Navbar). */
export function useMaybeLang(): LangContextValue | null {
  return useContext(LangContext)
}

/** Route element for `/:lang/*`: loads languages + blocks and validates the code. */
export function LangGuard() {
  const { lang = '' } = useParams()
  const code = lang.toLowerCase()
  const { languages, languagesStatus, languagesError, loadLanguages, loadBlocks } = useContentStore()
  const entry = useContentStore(s => s.blocks[code])
  const setSelectedLanguage = useAuthStore(s => s.setSelectedLanguage)

  const language = languages.find(l => l.code === code)

  useEffect(() => {
    void loadLanguages()
  }, [loadLanguages])

  useEffect(() => {
    if (language) {
      void loadBlocks(language.code)
      void setSelectedLanguage(language.code)
    }
  }, [language, loadBlocks, setSelectedLanguage])

  if (languagesStatus === 'error') {
    return <ErrorState message={languagesError} onRetry={() => loadLanguages(true)} />
  }
  if (languagesStatus !== 'ready') return <PageSkeleton />
  if (!language) return <LanguagePicker unknownCode={lang} />
  if (entry?.status === 'error') {
    return <ErrorState message={entry.error} onRetry={() => loadBlocks(code, true)} />
  }
  if (!entry || entry.status !== 'ready') return <PageSkeleton />

  return (
    <LangContext.Provider value={{ code, language, blocks: entry.blocks }}>
      <Fragment key={code}>
        <Outlet />
      </Fragment>
    </LangContext.Provider>
  )
}
