import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import type { Word } from '../types'
import Stats from '../components/Stats'

const card = 'rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6'

const scoreColor = (score: number) =>
  score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-rose-500'

export default function StatsPage() {
  const { code, language, blocks } = useLang()
  const userProgress = useLangProgress(code)
  const words = blocks.flatMap(b => b.words)
  const orderOf = (id: string) => blocks.find(b => b.id === id)?.order ?? Infinity
  const completed = [...userProgress.completedBlocks].sort((a, b) => orderOf(a.blockId) - orderOf(b.blockId))
  const mistakes = userProgress.mistakes || {}
  const firstOrder = blocks[0]?.order ?? 1

  const missed = Object.entries(mistakes)
    .filter(([, n]) => n > 0)
    .map(([id, count]) => ({ word: words.find(w => w.id === id), count }))
    .filter((m): m is { word: Word; count: number } => !!m.word)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const isEmpty = completed.length === 0 && missed.length === 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Статистика
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{language.flag} {language.name} · відстежуйте свій прогрес</p>
      </div>

      <Stats lang={code} />

      {isEmpty ? (
        <div className={`${card} text-center`}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ChartBarIcon className="h-6 w-6" />
          </div>
          <h2 className="mb-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Поки що немає даних
          </h2>
          <p className="mb-6 text-zinc-500 dark:text-zinc-400">
            Пройдіть перший блок, щоб побачити тут свої результати.
          </p>
          <Link
            to={`/${code}/block/${firstOrder}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          >
            Почати перший блок
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="mb-4 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Результати блоків</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Ще немає пройдених блоків.</p>
            ) : (
              <ul className="space-y-3">
                {completed.map(cb => {
                  const block = blocks.find(b => b.id === cb.blockId)
                  if (!block) return null
                  return (
                    <li key={cb.blockId}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <Link
                          to={`/${code}/block/${block.order}`}
                          className="truncate text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                        >
                          {block.title}
                        </Link>
                        <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{cb.score}/10</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, cb.score * 10)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${scoreColor(cb.score)}`}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className={card}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Найчастіші помилки</h2>
              {missed.length > 0 && (
                <Link
                  to={`/${code}/review`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Повторити
                </Link>
              )}
            </div>
            {missed.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Помилок немає — так тримати!</p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {missed.map(({ word, count }) => (
                  <li key={word.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100" lang={code}>{word.term}</p>
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{word.translation}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-rose-600 dark:text-rose-400">
                      ×{count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </motion.div>
  )
}
