import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { langAdverb } from '../utils/lang'
import { soundManager } from '../utils/sound'
import { normalizeAnswer } from '../utils/normalize'
import { ActionBar, LessonHeader, LessonShell, haptic, type Feedback } from '../components/LessonKit'
import type { Word } from '../types'

type Mode = 'all' | 'mistakes'

const SESSION_GOAL = 20

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

function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text: string; action: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-auto py-10 text-center">
      <div className="relative mx-auto h-32 w-32">
        <div className="absolute inset-0 animate-float rounded-[42%_58%_55%_45%/45%_45%_55%_55%] bg-brand-gradient opacity-90 shadow-glow" />
        <div className="relative flex h-full w-full items-center justify-center text-6xl">{emoji}</div>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-ink-2">{text}</p>
      <div className="mt-8">{action}</div>
    </motion.div>
  )
}

export default function Repeat() {
  const navigate = useNavigate()
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
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const home = `/${code}`

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

  // Keep focus in the input (keeps the mobile keyboard open; Enter submits / goes next)
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentWord])

  const check = () => {
    if (!currentWord || isCorrect !== null || !answer.trim()) return
    const ok = isAnswerCorrect(answer, currentWord.term)
    setIsCorrect(ok)
    haptic(ok)
    if (!ok) setShake(s => s + 1)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isCorrect === null) check()
    else handleNext()
  }

  // Enter outside the input (e.g. after tapping elsewhere) -> next
  useEffect(() => {
    if (isCorrect === null) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key === 'Enter' && t?.tagName !== 'INPUT' && t?.tagName !== 'BUTTON') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isCorrect, handleNext])

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setCurrentWord(null)
    setAnswer('')
    setIsCorrect(null)
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const header = (
    <LessonHeader progress={Math.min(stats.total / SESSION_GOAL, 1)} onClose={() => navigate(home)} combo={stats.streak} />
  )

  if (learnedPool.length === 0) {
    return (
      <LessonShell header={header}>
        <EmptyState
          emoji="📚"
          title="Ще немає вивчених слів"
          text="Пройдіть свій перший блок — і слова з нього з'являться тут для повторення."
          action={
            <Link to={`${home}/block/${firstBlockOrder}`} className="btn btn-lg btn-primary">
              Почати перший блок 🚀
            </Link>
          }
        />
      </LessonShell>
    )
  }

  const feedback: Feedback =
    isCorrect === null || !currentWord
      ? null
      : isCorrect
        ? { ok: true, answer: currentWord.term, lang: code }
        : {
            ok: false,
            title: 'Правильно:',
            answer: currentWord.term,
            example: currentWord.example,
            exampleTranslation: currentWord.exampleTranslation,
            lang: code,
          }

  return (
    <LessonShell
      header={header}
      bottom={
        currentWord ? (
          <ActionBar
            feedback={feedback}
            label={isCorrect === null ? 'Перевірити' : 'Далі'}
            onClick={() => (isCorrect === null ? check() : handleNext())}
            disabled={isCorrect === null && !answer.trim()}
            hint="Enter — перевірити"
          />
        ) : undefined
      }
    >
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">Повторення</h1>
          <p className="truncate text-sm text-ink-3">
            {language.flag} {language.name}
          </p>
        </div>
        <div role="tablist" className="relative inline-flex shrink-0 rounded-2xl bg-surface-2 p-1">
          {([
            ['all', 'Усі', learnedPool.length],
            ['mistakes', 'Помилки', mistakesPool.length],
          ] as const).map(([m, label, count]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`relative z-10 rounded-xl px-3 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ${
                mode === m ? 'text-ink' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {mode === m && (
                <motion.span layoutId="repeat-seg" className="absolute inset-0 -z-10 rounded-xl bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              {label}{' '}
              <span className={`ml-0.5 rounded-full px-1.5 text-xs ${m === 'mistakes' && count > 0 ? 'bg-rose-500/15 text-rose-500' : 'bg-line/60'}`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">✓ {stats.correct}/{stats.total}</span>
        <span className="chip bg-sky-500/15 text-sky-600 dark:text-sky-400">🎯 {accuracy}%</span>
        <span className="chip bg-orange-500/15 text-orange-600 dark:text-orange-400">🔥 найкраща серія {stats.best}</span>
      </div>

      {!currentWord ? (
        <EmptyState
          emoji="🎉"
          title="Помилок немає"
          text="Чудово! Усі слова з помилками виправлено."
          action={
            <button onClick={() => switchMode('all')} className="btn btn-lg btn-primary">
              Повторити всі слова
            </button>
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id + '-' + stats.total}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="pt-8 text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-sm font-bold text-brand-600 dark:text-brand-300">
              {mode === 'mistakes' ? '🩹 Виправляємо помилки' : '🔁 Як перекласти?'}
            </div>
            <h2 className="mt-5 break-words text-4xl font-extrabold sm:text-5xl">{currentWord.translation}</h2>
            <p className="mt-2 text-sm text-ink-3">Напишіть {adverb}</p>

            <form onSubmit={handleSubmit} className="mt-8">
              <div key={shake} className={isCorrect === false ? 'animate-shake' : ''}>
                <input
                  ref={inputRef}
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  readOnly={isCorrect !== null}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint={isCorrect === null ? 'done' : 'next'}
                  lang={code}
                  aria-label={`Відповідь ${adverb}`}
                  placeholder="Ваша відповідь…"
                  className={`input py-5 text-center font-display text-2xl font-bold sm:text-3xl ${
                    isCorrect === true
                      ? '!border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : isCorrect === false
                        ? '!border-rose-500 text-rose-600 dark:text-rose-400'
                        : ''
                  }`}
                />
              </div>
              <p className="mt-3 hidden text-xs text-ink-3 sm:block">Enter — {isCorrect === null ? 'перевірити' : 'далі'}</p>
            </form>
            {mode === 'mistakes' && <p className="mt-4 text-sm text-ink-3">Правильна відповідь прибирає слово зі списку помилок.</p>}
          </motion.div>
        </AnimatePresence>
      )}
    </LessonShell>
  )
}

