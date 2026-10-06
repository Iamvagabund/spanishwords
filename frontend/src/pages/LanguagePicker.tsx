import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { useContentStore } from '../store/contentStore'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { ErrorState, Skeleton, SlowServerHint } from '../components/LoadState'
import { languageTone } from '../theme/palette'

function Ring({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="white" strokeOpacity=".25" strokeWidth="7" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-extrabold text-white">{pct}%</span>
    </div>
  )
}

export default function LanguagePicker({ unknownCode }: { unknownCode?: string }) {
  const { languages, languagesStatus, languagesError, loadLanguages } = useContentStore()
  const progress = useStore(s => s.progress)
  const selected = useAuthStore(s => s.user?.selectedLanguage)
  const setSelectedLanguage = useAuthStore(s => s.setSelectedLanguage)

  useEffect(() => {
    void loadLanguages()
  }, [loadLanguages])

  return (
    <div className="py-2 sm:py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 animate-float place-items-center rounded-3xl bg-brand-gradient text-3xl shadow-glow" aria-hidden>
          🌍
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Яку мову <span className="text-gradient">вивчаємо?</span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          {unknownCode
            ? `Мову «${unknownCode}» не знайдено — оберіть одну з доступних.`
            : 'Прогрес зберігається окремо для кожної мови.'}
        </p>
      </motion.div>

      {languagesStatus === 'error' ? (
        <ErrorState message={languagesError} onRetry={() => loadLanguages(true)} />
      ) : languagesStatus !== 'ready' ? (
        <>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {[0, 1].map(i => (
              <Skeleton key={i} className="h-60 rounded-3xl" />
            ))}
          </div>
          <SlowServerHint />
        </>
      ) : languages.length === 0 ? (
        <ErrorState title="Мов поки немає" message="Адміністратор ще не додав жодної мови." />
      ) : (
        <motion.div
          className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {languages.map(lang => {
            const tone = languageTone(lang.code)
            const p = progress[lang.code]
            const done = p?.completedBlocks.length ?? 0
            const words = p?.learnedWords.length ?? 0
            const pct = lang.blockCount ? Math.min(100, Math.round((done / lang.blockCount) * 100)) : 0
            const current = lang.code === selected
            return (
              <motion.div
                key={lang.code}
                variants={{ hidden: { opacity: 0, y: 24, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <Link
                  to={`/${lang.code}`}
                  onClick={() => void setSelectedLanguage(lang.code)}
                  className={`group relative block h-full overflow-hidden rounded-3xl bg-gradient-to-br ${tone.gradient} p-6 text-white shadow-lift transition duration-200 hover:-translate-y-1 active:scale-[.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40`}
                >
                  <span className="pointer-events-none absolute -right-8 -top-10 select-none text-[10rem] leading-none opacity-20 transition group-hover:rotate-6 group-hover:scale-110" aria-hidden>
                    {lang.flag}
                  </span>
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white/20 text-6xl leading-none shadow-soft backdrop-blur" aria-hidden>
                      {lang.flag}
                    </span>
                    <Ring pct={pct} />
                  </div>
                  <div className="relative mt-5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-extrabold">{lang.name}</h2>
                      {current && <span className="chip bg-white/25 text-white">Поточна</span>}
                    </div>
                    <p className="font-semibold text-white/80">{lang.nativeName}</p>
                  </div>
                  <div className="relative mt-4 flex flex-wrap gap-2">
                    <span className="chip bg-black/15 text-white">📚 {lang.blockCount} блоків</span>
                    <span className="chip bg-black/15 text-white">✅ {done} пройдено</span>
                    {words > 0 && <span className="chip bg-black/15 text-white">🧠 {words} слів</span>}
                  </div>
                  <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 font-extrabold text-ink shadow-soft transition group-active:translate-y-0.5 dark:bg-surface">
                    {done ? 'Продовжити' : 'Почати'}
                    <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
