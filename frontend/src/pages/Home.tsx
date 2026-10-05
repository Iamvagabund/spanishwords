import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  LockClosedIcon,
  PlayIcon,
  TrophyIcon,
  ChartBarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { blockState, langAdverb } from '../utils/lang'

export default function Home() {
  const { code, language, blocks: rawBlocks } = useLang()
  const userProgress = useLangProgress(code)
  const { sorted: blocks, completed, isLocked, next: nextBlock } = blockState(rawBlocks, userProgress)

  const completedCount = blocks.filter(b => completed.has(b.id)).length
  const total = blocks.length
  const percent = total ? Math.round((completedCount / total) * 100) : 0
  const avg = Math.round((userProgress.averageScore || 0) * 10) / 10

  const stats = [
    { icon: AcademicCapIcon, label: 'Рівень', value: userProgress.currentLevel ?? 1 },
    { icon: TrophyIcon, label: 'Пройдено блоків', value: `${completedCount} / ${total}` },
    { icon: ChartBarIcon, label: 'Середній бал', value: completedCount ? `${avg}/10` : '—' },
  ]

  return (
    <div className="py-6 sm:py-10 space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <span aria-hidden>{language.flag}</span> {language.name}
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {nextBlock ? `Продовжуйте вивчати слова ${langAdverb(language)} — крок за кроком.` : total ? 'Усі блоки пройдено. Чудова робота!' : 'Блоків для цієї мови ще немає.'}
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-500 dark:text-zinc-400">Загальний прогрес</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{percent}%</span>
          </div>
          <div
            className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {nextBlock && (
          <Link
            to={`/${code}/block/${nextBlock.order}`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          >
            <PlayIcon className="h-5 w-5" />
            {completedCount ? 'Продовжити' : 'Почати навчання'}
          </Link>
        )}
      </motion.section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">Блоки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block, i) => {
            const done = completed.get(block.id)
            const isNext = nextBlock?.id === block.id
            const locked = isLocked(block)

            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Блок {block.order} · {block.level}
                    </div>
                    <h3 className="mt-1 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{block.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{block.titleTarget}</p>
                  </div>
                  {done ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircleIcon className="h-4 w-4" />
                      {done.score}/10
                    </span>
                  ) : locked ? (
                    <LockClosedIcon className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Слів: {block.words.length}</span>
                  {isNext && (
                    <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                      Почати <PlayIcon className="h-4 w-4" />
                    </span>
                  )}
                  {done && <span className="text-zinc-500 dark:text-zinc-400">Повторити</span>}
                </div>
              </>
            )

            const base = 'block h-full rounded-2xl border p-5 transition'
            const anim = {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: Math.min(i * 0.03, 0.3) },
            }

            if (locked) {
              return (
                <motion.div
                  key={block.id}
                  {...anim}
                  aria-disabled="true"
                  title="Спершу пройдіть попередній блок"
                  className={`${base} cursor-not-allowed opacity-60 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800`}
                >
                  {body}
                </motion.div>
              )
            }

            return (
              <motion.div key={block.id} {...anim}>
                <Link
                  to={`/${code}/block/${block.order}`}
                  className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                    isNext
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-400 dark:hover:border-indigo-500/70'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {body}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
