import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  AcademicCapIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { useStore, useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { langAdverb } from '../utils/lang'
import type { Word } from '../types'

type Phase = 'list' | 'choice' | 'intro' | 'typing' | 'result'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const card = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl'

const normalizeAnswer = (answer: string): string[] => {
  const clean = answer
    .toLowerCase()
    .replace(/[.,/#!¡?¿$%^&*;:{}=\-_`~()"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const withoutAccents = clean.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return [clean, withoutAccents]
}

const isAnswerCorrect = (answer: string, correct: string) => {
  if (!answer.trim()) return false
  const user = normalizeAnswer(answer)
  const right = normalizeAnswer(correct)
  return user.some(u => right.includes(u))
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const buildOptions = (correct: string, allTerms: string[]): string[] => {
  const pool = shuffle([...new Set(allTerms.filter(s => s !== correct))])
  return shuffle([correct, ...pool.slice(0, 3)])
}

/** Converts a percentage to the 1..10 scale stored in completedBlocks. */
const toTenScale = (percentage: number) =>
  percentage >= 100 ? 10 : Math.max(1, Math.floor(percentage / 10))

const PASS_PERCENT = 70

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-indigo-600"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

export function BlockPage() {
  const { order } = useParams()
  const navigate = useNavigate()
  const { code, language, blocks: storeBlocks } = useLang()
  const userProgress = useLangProgress(code)
  const completeBlock = useStore(s => s.completeBlock)
  const addMistake = useStore(s => s.addMistake)
  const removeMistake = useStore(s => s.removeMistake)
  const adverb = langAdverb(language)

  const numericOrder = Number(order)
  const block = useMemo(() => storeBlocks.find(b => b.order === numericOrder) ?? null, [storeBlocks, numericOrder])
  const blockWords = useMemo<Word[]>(() => block?.words ?? [], [block])
  const allTerms = useMemo(() => storeBlocks.flatMap(b => b.words.map(w => w.term)), [storeBlocks])
  const home = `/${code}`

  const [phase, setPhase] = useState<Phase>('list')
  const [index, setIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [checked, setChecked] = useState<boolean | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const reset = () => {
    setPhase('list')
    setIndex(0)
    setUserInput('')
    setChecked(null)
    setAnswers({})
    setResults({})
    setWrongChoice(null)
  }

  // Reset all learning state when navigating to another block
  useEffect(() => {
    reset()
  }, [code, numericOrder])

  // Locked-block redirect: previous block (by order) must be completed
  useEffect(() => {
    if (!block) return
    const done = new Set(userProgress.completedBlocks.map(b => b.blockId))
    if (done.has(block.id)) return
    const prev = [...storeBlocks].filter(b => b.order < block.order).sort((a, b) => b.order - a.order)[0]
    if (prev && !done.has(prev.id)) navigate(`${home}/block/${prev.order}`, { replace: true })
  }, [block, storeBlocks, userProgress.completedBlocks, navigate, home])

  const currentWord = blockWords[index]

  // Stable multiple-choice options per word (previously reshuffled on every render)
  useEffect(() => {
    if (phase === 'choice' && currentWord) {
      setOptions(buildOptions(currentWord.term, allTerms))
      setWrongChoice(null)
    }
  }, [phase, currentWord, allTerms])

  useEffect(() => {
    if (phase !== 'typing') return
    if (checked === null) inputRef.current?.focus()
    else nextRef.current?.focus()
  }, [phase, index, checked])

  // Keyboard shortcuts for multiple choice (1-4)
  useEffect(() => {
    if (phase !== 'choice') return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) handleChoice(options[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!block || blockWords.length === 0) {
    return (
      <div className={`${card} p-8 text-center mt-6`}>
        <p className="text-rose-600 dark:text-rose-400 font-medium">Блок не знайдено</p>
        <Link to={home} className={`${secondaryBtn} mt-4`}>
          <HomeIcon className="h-5 w-5" /> На головну
        </Link>
      </div>
    )
  }

  const total = blockWords.length

  function handleChoice(option: string) {
    if (!currentWord) return
    if (isAnswerCorrect(option, currentWord.term)) {
      setWrongChoice(null)
      if (index < total - 1) setIndex(i => i + 1)
      else {
        setIndex(0)
        setPhase('intro')
      }
    } else {
      setWrongChoice(option)
    }
  }

  const finish = (finalAnswers: Record<string, string>, finalResults: Record<string, boolean>) => {
    const correctCount = blockWords.filter(w => finalResults[w.id]).length
    const percentage = (correctCount / total) * 100
    if (percentage >= PASS_PERCENT) completeBlock(code, block.id, toTenScale(percentage), blockWords.map(w => w.id))
    setAnswers(finalAnswers)
    setResults(finalResults)
    setPhase('result')
  }

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord) return
    if (checked === null) {
      if (!userInput.trim()) return
      const ok = isAnswerCorrect(userInput, currentWord.term)
      if (ok) removeMistake(code, currentWord.id)
      else addMistake(code, currentWord.id)
      setAnswers(a => ({ ...a, [currentWord.id]: userInput }))
      setResults(r => ({ ...r, [currentWord.id]: ok }))
      setChecked(ok)
      return
    }
    // second Enter: go next
    if (index < total - 1) {
      setIndex(i => i + 1)
      setUserInput('')
      setChecked(null)
    } else {
      finish(answers, results)
    }
  }

  const header = (progressValue: number, label?: string) => (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={home}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Назад
        </Link>
        {label && <span className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">{label}</span>}
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{block.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400" lang={code}>{block.titleTarget}</p>
      </div>
      <ProgressBar value={progressValue} total={total} />
    </div>
  )

  const fade = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2 },
  }

  // ---------- RESULT ----------
  if (phase === 'result') {
    const correctCount = blockWords.filter(w => results[w.id]).length
    const percentage = (correctCount / total) * 100
    const passed = percentage >= PASS_PERCENT
    const nextBlock = [...storeBlocks].filter(b => b.order > block.order).sort((a, b) => a.order - b.order)[0]

    return (
      <div className="max-w-2xl mx-auto py-6">
        <motion.div {...fade} className={`${card} p-6 sm:p-8 text-center`}>
          <div className="text-5xl mb-3">{passed ? (percentage === 100 ? '🏆' : '🎉') : '💪'}</div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {passed ? 'Чудово!' : 'Потрібно ще попрацювати'}
          </h2>
          <div className="mt-6 flex justify-center gap-8">
            <div>
              <div className="text-4xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {correctCount}/{total}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">правильно · {Math.round(percentage)}%</div>
            </div>
            <div>
              <div className={`text-4xl font-semibold tabular-nums ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {toTenScale(percentage)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">бал з 10</div>
            </div>
          </div>
          {!passed && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              Для проходження блоку потрібно щонайменше {PASS_PERCENT}%
            </p>
          )}

          <ul className="mt-6 space-y-2 text-left">
            {blockWords.map(w => {
              const ok = results[w.id]
              return (
                <li
                  key={w.id}
                  className={`flex items-start gap-3 rounded-xl p-3 ${ok ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                >
                  {ok ? (
                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{w.translation}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 break-words">
                      {ok ? w.term : (
                        <>
                          <span className="line-through">{answers[w.id] || '—'}</span>{' '}
                          → <span className="text-emerald-600 dark:text-emerald-400 font-medium">{w.term}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {passed && nextBlock && (
              <button onClick={() => navigate(`${home}/block/${nextBlock.order}`)} className={primaryBtn} autoFocus>
                Наступний блок <ArrowRightIcon className="h-5 w-5" />
              </button>
            )}
            <button onClick={reset} className={passed ? secondaryBtn : primaryBtn} autoFocus={!passed}>
              <ArrowPathIcon className="h-5 w-5" /> Пройти ще раз
            </button>
            <button onClick={() => navigate(home)} className={secondaryBtn}>
              <HomeIcon className="h-5 w-5" /> На головну
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ---------- WORD LIST ----------
  if (phase === 'list') {
    return (
      <div className="max-w-2xl mx-auto py-6">
        {header(0, `${total} слів`)}
        <motion.div {...fade} className={`${card} divide-y divide-zinc-200 dark:divide-zinc-800`}>
          {blockWords.map((w, i) => (
            <div key={w.id} className="flex items-center gap-4 px-5 py-4">
              <span className="w-6 text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <span className="text-zinc-500 dark:text-zinc-400">{w.translation}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100" lang={code}>{w.term}</span>
              </div>
            </div>
          ))}
        </motion.div>
        <button
          onClick={() => {
            setIndex(0)
            setPhase('choice')
          }}
          className={`${primaryBtn} w-full mt-6 py-3`}
          autoFocus
        >
          <AcademicCapIcon className="h-5 w-5" /> Почати тренування
        </button>
      </div>
    )
  }

  // ---------- INTRO TO TYPING ----------
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto py-6">
        {header(total, 'Етап 1 завершено')}
        <motion.div {...fade} className={`${card} p-8 text-center`}>
          <PencilSquareIcon className="h-12 w-12 mx-auto text-indigo-500" />
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Чудово! Тепер напишіть слова самостійно
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Перекладайте з української {adverb}</p>
          <button
            onClick={() => {
              setIndex(0)
              setUserInput('')
              setChecked(null)
              setAnswers({})
              setResults({})
              setPhase('typing')
            }}
            className={`${primaryBtn} mt-6`}
            autoFocus
          >
            Почати тест <ArrowRightIcon className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    )
  }

  // ---------- MULTIPLE CHOICE ----------
  if (phase === 'choice') {
    return (
      <div className="max-w-2xl mx-auto py-6">
        {header(index, `Вибір · слово ${index + 1} з ${total}`)}
        <AnimatePresence mode="wait">
          <motion.div key={`c-${index}`} {...fade}>
            <div className={`${card} p-8 sm:p-12 text-center`}>
              <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Як {adverb}?</div>
              <div className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-words">
                {currentWord.translation}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, i) => {
                const wrong = wrongChoice === opt
                return (
                  <button
                    key={opt}
                    onClick={() => handleChoice(opt)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left text-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                      wrong
                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-indigo-500 hover:bg-indigo-500/5'
                    }`}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="break-words">{opt}</span>
                  </button>
                )
              })}
            </div>
            {wrongChoice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400"
              >
                <XCircleIcon className="h-5 w-5" /> Неправильно, спробуйте ще раз
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ---------- TYPING TEST ----------
  const isLast = index === total - 1
  return (
    <div className="max-w-2xl mx-auto py-6">
      {header(index + (checked !== null ? 1 : 0), `Слово ${index + 1} з ${total}`)}
      <AnimatePresence mode="wait">
        <motion.div key={`t-${index}`} {...fade}>
          <div className={`${card} p-8 sm:p-12 text-center`}>
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Перекладіть {adverb}</div>
            <div className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-words">
              {currentWord.translation}
            </div>
          </div>

          <form onSubmit={handleTypingSubmit} className="mt-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              readOnly={checked !== null}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`Відповідь ${adverb}`}
              lang={code}
              placeholder={`Введіть слово ${adverb}…`}
              className={`w-full rounded-xl px-4 py-3 text-lg bg-white dark:bg-zinc-900 border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                checked === true
                  ? 'border-emerald-500 focus:ring-emerald-500/60'
                  : checked === false
                    ? 'border-rose-500 focus:ring-rose-500/60'
                    : 'border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500/60'
              }`}
            />

            {checked !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 rounded-xl p-4 ${
                  checked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {checked ? <CheckCircleIcon className="h-6 w-6 shrink-0" /> : <XCircleIcon className="h-6 w-6 shrink-0" />}
                <div>
                  <div className="font-medium">{checked ? 'Правильно!' : 'Неправильно'}</div>
                  <div className="text-sm">
                    Правильна відповідь: <span className="font-semibold" lang={code}>{currentWord.term}</span>
                  </div>
                  {currentWord.example && (
                    <div className="mt-2 border-t border-current/10 pt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <p className="italic" lang={code}>{currentWord.example}</p>
                      {currentWord.exampleTranslation && (
                        <p className="text-zinc-500 dark:text-zinc-400">{currentWord.exampleTranslation}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {checked === null ? (
              <button type="submit" disabled={!userInput.trim()} className={`${primaryBtn} w-full py-3`}>
                Перевірити <span className="text-xs opacity-70">Enter</span>
              </button>
            ) : (
              <button ref={nextRef} type="submit" className={`${primaryBtn} w-full py-3`}>
                {isLast ? 'Завершити' : 'Далі'} <ArrowRightIcon className="h-5 w-5" />
              </button>
            )}
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
