import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowPathIcon, PlayIcon } from '@heroicons/react/24/solid'
import { useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import type { Word } from '../types'
import Stats, { ProgressRing, useProgressSummary } from '../components/Stats'
import { blockEmoji, blockTone, languageTone } from '../theme/palette'

const scoreColor = (score: number) =>
  score >= 8 ? 'from-emerald-400 to-teal-500' : score >= 5 ? 'from-amber-300 to-orange-500' : 'from-pink-400 to-rose-500'
const scoreText = (score: number) =>
  score >= 8 ? 'text-emerald-600 dark:text-emerald-300' : score >= 5 ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'

export default function StatsPage() {
  const { code, language, blocks } = useLang()
  const userProgress = useLangProgress(code)
  const summary = useProgressSummary(code)
  const words = blocks.flatMap(b => b.words)
  const orderOf = (id: string) => blocks.find(b => b.id === id)?.order ?? Infinity
  const completed = [...userProgress.completedBlocks].sort((a, b) => orderOf(a.blockId) - orderOf(b.blockId))
  const mistakes = userProgress.mistakes || {}
  const firstOrder = [...blocks].sort((a, b) => a.order - b.order)[0]?.order ?? 1
  const tone = languageTone(code)

  const missed = Object.entries(mistakes)
    .filter(([, n]) => n > 0)
    .map(([id, count]) => ({ word: words.find(w => w.id === id), count }))
    .filter((m): m is { word: Word; count: number } => !!m.word)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const accuracy = summary.averageScore / 10
  const isEmpty = completed.length === 0 && missed.length === 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4 sm:py-8">
      <section className={`relative overflow-hidden rounded-4xl bg-gradient-to-br ${tone.gradient} p-5 text-white shadow-lift sm:p-7`}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/80">
              <span aria-hidden>{language.flag}</span> {language.name}
            </p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Статистика</h1>
            <p className="mt-1 text-sm text-white/85">
              {isEmpty ? 'Тут з’являться твої результати.' : accuracy >= 0.8 ? 'Чудова точність! 🔥' : 'Кожна спроба робить тебе сильнішим 💪'}
            </p>
          </div>
          <ProgressRing value={accuracy} size={96} stroke={10}>
            <span className="font-display text-xl font-extrabold leading-none">{Math.round(accuracy * 100)}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">точність</span>
          </ProgressRing>
        </div>
      </section>

      <Stats lang={code} />

      {isEmpty ? (
        <div className="card rounded-4xl px-6 py-10 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 animate-float items-center justify-center rounded-[2rem] bg-brand-gradient text-5xl shadow-glow">
            📊
          </div>
          <h2 className="mb-1 text-xl font-extrabold text-ink">Поки що немає даних</h2>
          <p className="mx-auto mb-6 max-w-sm text-ink-2">Пройди перший блок — і тут з’являться бали, графіки та слова для повторення.</p>
          <Link to={`/${code}/block/${firstOrder}`} className="btn btn-primary btn-lg">
            <PlayIcon className="h-5 w-5" /> Почати перший блок
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card rounded-3xl p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-extrabold text-ink">Результати блоків</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-ink-2">Ще немає пройдених блоків.</p>
            ) : (
              <ul className="space-y-4">
                {completed.map((cb, i) => {
                  const block = blocks.find(b => b.id === cb.blockId)
                  if (!block) return null
                  return (
                    <li key={cb.blockId}>
                      <Link to={`/${code}/block/${block.order}`} className="flex items-center gap-3 rounded-2xl active:scale-[0.99]">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${blockTone(block.order).gradient} text-xl`}
                          aria-hidden
                        >
                          {blockEmoji(block.title)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1.5 flex items-baseline justify-between gap-3">
                            <span className="truncate text-sm font-bold text-ink">{block.title}</span>
                            <span className={`shrink-0 font-display text-sm font-extrabold tabular-nums ${scoreText(cb.score)}`}>
                              {cb.score}/10
                            </span>
                          </span>
                          <span className="progress-track block h-2.5">
                            <motion.span
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, cb.score * 10)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.04 }}
                              className={`block h-full rounded-full bg-gradient-to-r ${scoreColor(cb.score)}`}
                            />
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="card rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-ink">Найчастіші помилки</h2>
              {missed.length > 0 && <span className="chip bg-rose-500/15 text-rose-600 dark:text-rose-300">{missed.length}</span>}
            </div>
            {missed.length === 0 ? (
              <div className="rounded-2xl bg-emerald-500/10 p-5 text-center">
                <p className="text-3xl">🎯</p>
                <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">Помилок немає — так тримати!</p>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {missed.map(({ word, count }) => (
                    <li key={word.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink" lang={code}>
                          {word.term}
                        </p>
                        <p className="truncate text-sm text-ink-2">{word.translation}</p>
                      </div>
                      <span className="flex h-8 min-w-[2.5rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 px-2 text-sm font-extrabold tabular-nums text-white">
                        ×{count}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to={`/${code}/review`} className="btn btn-danger btn-lg mt-4 w-full">
                  <ArrowPathIcon className="h-5 w-5" /> Повторити помилки
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </motion.div>
  )
}
