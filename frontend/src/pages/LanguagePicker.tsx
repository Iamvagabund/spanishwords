import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRightIcon, CheckCircleIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useContentStore } from '../store/contentStore'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { ErrorState, Skeleton, SlowServerHint } from '../components/LoadState'

export default function LanguagePicker({ unknownCode }: { unknownCode?: string }) {
  const { languages, languagesStatus, languagesError, loadLanguages } = useContentStore()
  const progress = useStore(s => s.progress)
  const setSelectedLanguage = useAuthStore(s => s.setSelectedLanguage)

  useEffect(() => {
    void loadLanguages()
  }, [loadLanguages])

  return (
    <div className="py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <LanguageIcon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Яку мову вивчаємо?
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {unknownCode
            ? `Мову «${unknownCode}» не знайдено — оберіть одну з доступних.`
            : 'Оберіть мову — прогрес зберігається окремо для кожної.'}
        </p>
      </motion.div>

      {languagesStatus === 'error' ? (
        <ErrorState message={languagesError} onRetry={() => loadLanguages(true)} />
      ) : languagesStatus !== 'ready' ? (
        <>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map(i => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
          <SlowServerHint />
        </>
      ) : languages.length === 0 ? (
        <ErrorState title="Мов поки немає" message="Адміністратор ще не додав жодної мови." />
      ) : (
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {languages.map((lang, i) => {
            const p = progress[lang.code]
            const done = p?.completedBlocks.length ?? 0
            const pct = lang.blockCount ? Math.min(100, Math.round((done / lang.blockCount) * 100)) : 0
            return (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/${lang.code}`}
                  onClick={() => void setSelectedLanguage(lang.code)}
                  className="group block h-full rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-5xl leading-none" aria-hidden>
                      {lang.flag}
                    </span>
                    {done > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        {done} / {lang.blockCount}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{lang.name}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{lang.nativeName}</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Блоків: {lang.blockCount}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-indigo-600 transition group-hover:gap-2 dark:text-indigo-400">
                      {done ? 'Продовжити' : 'Почати'} <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
