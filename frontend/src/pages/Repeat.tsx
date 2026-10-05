import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useStore, useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { langAdverb } from '../utils/lang'
import { soundManager } from '../utils/sound'
import { normalizeAnswer } from '../utils/normalize'
import type { Word } from '../types'

type Mode = 'all' | 'mistakes'

const isAnswerCorrect = (answer: string, correct: string) => {
  const [a] = normalizeAnswer(answer.trim())
  const [c] = normalizeAnswer(correct.trim())
  return a.length > 0 && a === c
}

const pickRandom = (pool: Word[], exclude?: string): Word | null => {
  if (pool.length === 0) return null
  const candidates = pool.length > 1 ? pool.filter(w => w.id !== exclude) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-500 text-white`
const btnSecondary = `${btnBase} bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100`

export default function Repeat() {
  const { code, language, blocks } = useLang()
  const userProgress = useLangProgress(code)
  const addMistake = useStore(s => s.addMistake)
  const removeMistake = useStore(s => s.removeMistake)
  const adverb = langAdverb(language)
  const words = useMemo(() => blocks.flatMap(b => b.words), [blocks])
  const firstBlockOrder = useMemo(() => Math.min(...blocks.map(b => b.order), 1), [blocks])
  const [mode, setMode] = useState<Mode>('all')
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [answer, setAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, best: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const learnedPool = useMemo(() => {
    const ids = new Set(userProgress.learnedWords)
    return words.filter(w => ids.has(w.id))
  }, [words, userProgress.learnedWords])

  const mistakesPool = useMemo(() => {
    const mistakes = userProgress.mistakes || {}
    return words.filter(w => (mistakes[w.id] || 0) > 0)
  }, [words, userProgress.mistakes])

  const pool = mode === 'mistakes' ? mistakesPool : learnedPool

  // Pick a word when mode changes or when the current one leaves the pool
  // (e.g. a fixed mistake), but not while feedback is showing.
  useEffect(() => {
    if (isCorrect !== null) return
    if (!currentWord || !pool.some(w => w.id === currentWord.id)) {
      setCurrentWord(pickRandom(pool, currentWord?.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, isCorrect])

  useEffect(() => {
    if (isCorrect === null) inputRef.current?.focus()
    else nextRef.current?.focus()
  }, [isCorrect, currentWord])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord || isCorrect !== null || !answer.trim()) return

    const ok = isAnswerCorrect(answer, currentWord.term)
    setIsCorrect(ok)
    setStats(s => {
      const streak = ok ? s.streak + 1 : 0
      return { correct: s.correct + (ok ? 1 : 0), total: s.total + 1, streak, best: Math.max(s.best, streak) }
    })

    if (ok) {
      soundManager.play('correct')
      if (mode === 'mistakes') removeMistake(code, currentWord.id)
    } else {
      soundManager.play('incorrect')
      addMistake(code, currentWord.id)
    }
  }

  const handleNext = useCallback(() => {
    const prevId = currentWord?.id
    // removeMistake may have shrunk the pool already; use the latest one
    setCurrentWord(pickRandom(pool, prevId))
    setAnswer('')
    setIsCorrect(null)
  }, [currentWord, pool])

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setCurrentWord(null)
    setAnswer('')
    setIsCorrect(null)
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0

  if (learnedPool.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md py-12 text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <BookOpenIcon className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Ще немає вивчених слів
        </h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          Пройдіть свій перший блок — і слова з нього з'являться тут для повторення.
        </p>
        <Link to={`/${code}/block/${firstBlockOrder}`} className={btnPrimary}>
          Почати перший блок
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Повторення
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {language.flag} {language.name} · вивчені слова
          </p>
        </div>
        <div
          role="tablist"
          className="inline-flex self-start rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/70"
        >
          {([
            ['all', `Усі (${learnedPool.length})`],
            ['mistakes', `Помилки (${mistakesPool.length})`],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                mode === m
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatPill label="Відповідей" value={`${stats.correct}/${stats.total}`} />
        <StatPill label="Точність" value={`${accuracy}%`} />
        <StatPill
          label="Серія"
          value={String(stats.streak)}
          icon={<FireIcon className={`h-4 w-4 ${stats.streak > 0 ? 'text-amber-500' : ''}`} />}
        />
      </div>

      {!currentWord ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CheckCircleIcon className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h2 className="mb-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Помилок немає
          </h2>
          <p className="mb-6 text-zinc-500 dark:text-zinc-400">
            Чудово! Усі слова з помилками виправлено.
          </p>
          <button onClick={() => switchMode('all')} className={btnSecondary}>
            <ArrowPathIcon className="h-5 w-5" />
            Повторити всі слова
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id + '-' + stats.total}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Перекладіть {adverb}
            </p>
            <p className="mb-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentWord.translation}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                readOnly={isCorrect !== null}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                lang={code}
                aria-label={`Відповідь ${adverb}`}
                placeholder={`Введіть слово ${adverb}`}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                  isCorrect === null
                    ? 'border-zinc-300 focus:ring-indigo-500/60 dark:border-zinc-700'
                    : isCorrect
                      ? 'border-emerald-500 focus:ring-emerald-500/40'
                      : 'border-rose-500 focus:ring-rose-500/40'
                }`}
              />

              {isCorrect === null ? (
                <button type="submit" disabled={!answer.trim()} className={`${btnPrimary} w-full`}>
                  Перевірити
                </button>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    role="status"
                    className={`flex items-start gap-3 rounded-xl p-4 ${
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircleIcon className="h-6 w-6 shrink-0" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{isCorrect ? 'Правильно!' : 'Неправильно'}</p>
                      <p className="text-sm">
                        {isCorrect ? 'Відповідь: ' : 'Правильна відповідь: '}
                        <span className="font-semibold" lang={code}>{currentWord.term}</span>
                      </p>
                      {currentWord.example && (
                        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          <p className="italic" lang={code}>{currentWord.example}</p>
                          {currentWord.exampleTranslation && (
                            <p className="text-zinc-500 dark:text-zinc-400">{currentWord.exampleTranslation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  <button
                    ref={nextRef}
                    type="button"
                    onClick={handleNext}
                    className={`${btnPrimary} w-full`}
                  >
                    Наступне слово
                    <span className="hidden text-xs text-indigo-200 sm:inline">Enter ↵</span>
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </AnimatePresence>
      )}

      {mode === 'mistakes' && currentWord && (
        <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
          Правильна відповідь прибирає слово зі списку помилок.
        </p>
      )}
      {stats.best > 1 && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Найкраща серія: {stats.best}</p>
      )}
    </div>
  )
}

function StatPill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="flex items-center gap-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {icon}
        {value}
      </p>
    </div>
  )
}
