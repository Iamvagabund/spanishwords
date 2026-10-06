import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HomeIcon } from '@heroicons/react/24/outline'
import { useStore, useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { langAdverb } from '../utils/lang'
import { blockEmoji, blockTone } from '../theme/palette'
import { ActionBar, ExitSheet, LessonHeader, LessonShell, ResultScreen, formatTime, haptic, type Feedback } from '../components/LessonKit'
import type { Word } from '../types'

type Phase = 'list' | 'choice' | 'intro' | 'typing' | 'result'

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
const toTenScale = (percentage: number) => (percentage >= 100 ? 10 : Math.max(1, Math.floor(percentage / 10)))

const PASS_PERCENT = 70

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A')

function FlashCard({ word, index, lang, gradient }: { word: Word; index: number; lang: string; gradient: string }) {
  const [flipped, setFlipped] = useState(false)
  const face = 'absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-5 text-center [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      onClick={() => setFlipped(f => !f)}
      className="relative h-44 w-full [perspective:1000px] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 rounded-3xl"
      aria-label={`${word.term} — ${word.translation}. Натисніть, щоб перевернути`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className={`${face} bg-gradient-to-br ${gradient} text-white shadow-lift`}>
          <span className="absolute left-4 top-3 text-xs font-bold opacity-70">{index + 1}</span>
          <span className="absolute right-4 top-3 text-xs font-bold opacity-70">↻</span>
          <span className="font-display text-3xl font-extrabold break-words" lang={lang}>{word.term}</span>
          {word.example && <span className="mt-2 line-clamp-2 text-sm italic opacity-90" lang={lang}>{word.example}</span>}
        </div>
        <div className={`${face} border-2 border-line bg-surface shadow-soft [transform:rotateY(180deg)]`}>
          <span className="absolute left-4 top-3 text-xs font-bold text-ink-3">🇺🇦</span>
          <span className="font-display text-3xl font-extrabold break-words text-ink">{word.translation}</span>
          {word.exampleTranslation && <span className="mt-2 line-clamp-2 text-sm text-ink-2">{word.exampleTranslation}</span>}
        </div>
      </motion.div>
    </motion.button>
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
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [combo, setCombo] = useState(0)
  const [shake, setShake] = useState(0)
  const [confirmExit, setConfirmExit] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase('list')
    setIndex(0)
    setUserInput('')
    setChecked(null)
    setAnswers({})
    setResults({})
    setSelected(null)
    setCombo(0)
    setConfirmExit(false)
  }

  // Reset all learning state when navigating to another block
  useEffect(() => {
    reset()
    window.scrollTo(0, 0)
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

  // Stable multiple-choice options per word
  useEffect(() => {
    if (phase === 'choice' && currentWord) {
      setOptions(buildOptions(currentWord.term, allTerms))
      setSelected(null)
      setChecked(null)
    }
  }, [phase, currentWord, allTerms])

  useEffect(() => {
    if (phase === 'typing') inputRef.current?.focus()
  }, [phase, index])

  const total = blockWords.length

  const startTraining = () => {
    startRef.current = Date.now()
    setIndex(0)
    setCombo(0)
    setPhase('choice')
    window.scrollTo(0, 0)
  }

  const finish = (finalAnswers: Record<string, string>, finalResults: Record<string, boolean>) => {
    if (!block) return
    const correctCount = blockWords.filter(w => finalResults[w.id]).length
    const percentage = (correctCount / total) * 100
    if (percentage >= PASS_PERCENT) completeBlock(code, block.id, toTenScale(percentage), blockWords.map(w => w.id))
    setAnswers(finalAnswers)
    setResults(finalResults)
    setElapsed(Date.now() - startRef.current)
    setPhase('result')
    window.scrollTo(0, 0)
  }

  const registerResult = (ok: boolean) => {
    haptic(ok)
    setCombo(c => (ok ? c + 1 : 0))
    if (!ok) setShake(s => s + 1)
  }

  // ----- multiple choice (practice, not graded) -----
  const checkChoice = useCallback(() => {
    if (!currentWord || !selected || checked !== null) return
    const ok = isAnswerCorrect(selected, currentWord.term)
    setChecked(ok)
    registerResult(ok)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, selected, checked])

  const nextChoice = useCallback(() => {
    if (checked === null) return
    if (!checked) {
      // wrong: try the same word again with reshuffled options
      setOptions(o => shuffle(o))
      setSelected(null)
      setChecked(null)
      return
    }
    if (index < total - 1) setIndex(i => i + 1)
    else {
      setIndex(0)
      setChecked(null)
      setPhase('intro')
    }
  }, [checked, index, total])

  // ----- typing test (graded) -----
  const checkTyping = () => {
    if (!currentWord || checked !== null || !userInput.trim()) return
    const ok = isAnswerCorrect(userInput, currentWord.term)
    if (ok) removeMistake(code, currentWord.id)
    else addMistake(code, currentWord.id)
    setAnswers(a => ({ ...a, [currentWord.id]: userInput }))
    setResults(r => ({ ...r, [currentWord.id]: ok }))
    setChecked(ok)
    registerResult(ok)
  }

  const nextTyping = () => {
    if (index < total - 1) {
      setIndex(i => i + 1)
      setUserInput('')
      setChecked(null)
    } else {
      finish(answers, results)
    }
  }

  const startTyping = () => {
    setIndex(0)
    setUserInput('')
    setChecked(null)
    setAnswers({})
    setResults({})
    setPhase('typing')
  }

  // Keyboard: 1-4 choose, Enter check/next (outside inputs/buttons, which handle Enter natively)
  useEffect(() => {
    if (confirmExit) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'choice') {
        const n = Number(e.key)
        if (checked === null && n >= 1 && n <= options.length) {
          setSelected(options[n - 1])
          return
        }
        if (e.key === 'Enter' && !isTypingTarget(e.target)) {
          e.preventDefault()
          if (checked === null) checkChoice()
          else nextChoice()
        }
      } else if (phase === 'intro' && e.key === 'Enter' && !isTypingTarget(e.target)) {
        e.preventDefault()
        startTyping()
      } else if (phase === 'list' && e.key === 'Enter' && !isTypingTarget(e.target)) {
        e.preventDefault()
        startTraining()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!block || blockWords.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 pt-safe pb-safe">
        <div className="card max-w-sm p-8 text-center">
          <div className="text-5xl">🔍</div>
          <p className="mt-3 font-display text-xl font-extrabold">Блок не знайдено</p>
          <Link to={home} className="btn btn-primary mt-6">
            <HomeIcon className="h-5 w-5" /> На головну
          </Link>
        </div>
      </div>
    )
  }

  const tone = blockTone(block.order)
  const emoji = blockEmoji(block.title)
  const inLesson = phase === 'choice' || phase === 'intro' || phase === 'typing'
  const requestClose = () => (inLesson ? setConfirmExit(true) : navigate(home))

  const exitSheet = <ExitSheet open={confirmExit} onStay={() => setConfirmExit(false)} onLeave={() => navigate(home)} />

  // ---------- RESULT ----------
  if (phase === 'result') {
    const correctCount = blockWords.filter(w => results[w.id]).length
    const percentage = (correctCount / total) * 100
    const passed = percentage >= PASS_PERCENT
    const nextBlock = [...storeBlocks].filter(b => b.order > block.order).sort((a, b) => a.order - b.order)[0]
    return (
      <ResultScreen
        percent={percentage}
        score10={toTenScale(percentage)}
        passed={passed}
        title={block.title}
        subtitle={block.titleTarget}
        emoji={emoji}
        gradient={tone.gradient}
        lang={code}
        chips={[
          { icon: '🎯', label: 'Точність', value: `${Math.round(percentage)}%` },
          { icon: '⏱️', label: 'Час', value: formatTime(elapsed) },
          { icon: '📚', label: 'Слова', value: `${correctCount}/${total}` },
        ]}
        mistakes={blockWords
          .filter(w => !results[w.id])
          .map(w => ({ id: w.id, translation: w.translation, term: w.term, answer: answers[w.id] }))}
        note={passed ? undefined : `Для проходження блоку потрібно щонайменше ${PASS_PERCENT}%`}
        onNext={nextBlock ? () => navigate(`${home}/block/${nextBlock.order}`) : undefined}
        onRetry={reset}
        onHome={() => navigate(home)}
      />
    )
  }

  // ---------- WORD LIST ----------
  if (phase === 'list') {
    return (
      <LessonShell
        header={<LessonHeader progress={0} onClose={requestClose} combo={0} />}
        bottom={<ActionBar feedback={null} label="Почати тренування" onClick={startTraining} hint="Enter — почати" />}
      >
        <div className={`relative mt-2 overflow-hidden rounded-4xl bg-gradient-to-br ${tone.gradient} p-6 text-white shadow-glow`}>
          <div className="absolute -right-6 -top-6 text-[7rem] opacity-20" aria-hidden>{emoji}</div>
          <div className="text-4xl">{emoji}</div>
          <h1 className="mt-2 text-3xl font-extrabold">{block.title}</h1>
          <p className="opacity-90" lang={code}>{block.titleTarget}</p>
          <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">{total} слів · торкніться картки, щоб перевернути</div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {blockWords.map((w, i) => (
            <FlashCard key={w.id} word={w} index={i} lang={code} gradient={tone.gradient} />
          ))}
        </div>
      </LessonShell>
    )
  }

  const progress =
    phase === 'choice'
      ? (index + (checked ? 1 : 0)) / (total * 2)
      : phase === 'intro'
        ? 0.5
        : (total + index + (checked !== null ? 1 : 0)) / (total * 2)

  const header = <LessonHeader progress={progress} onClose={requestClose} combo={combo} />

  const prompt = (label: string) => (
    <div className="pt-4 text-center">
      <div className={`mx-auto inline-flex items-center gap-2 rounded-full ${tone.soft} ${tone.text} px-3 py-1 text-sm font-bold`}>
        <span>{emoji}</span> {label}
      </div>
      <h1 className="mt-5 break-words text-4xl font-extrabold sm:text-5xl">{currentWord?.translation}</h1>
      <p className="mt-2 text-sm font-semibold text-ink-3 tabular-nums">
        {index + 1} / {total}
      </p>
    </div>
  )

  const feedback: Feedback =
    checked === null || !currentWord
      ? null
      : checked
        ? { ok: true, answer: phase === 'typing' ? currentWord.term : undefined, lang: code }
        : {
            ok: false,
            title: 'Правильно:',
            answer: currentWord.term,
            example: currentWord.example,
            exampleTranslation: currentWord.exampleTranslation,
            lang: code,
          }

  // ---------- INTRO TO TYPING ----------
  if (phase === 'intro') {
    return (
      <LessonShell header={header} bottom={<ActionBar feedback={null} label="Почати тест" onClick={startTyping} hint="Enter — почати" />}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="my-auto py-10 text-center">
          <div className={`mx-auto flex h-28 w-28 animate-float items-center justify-center rounded-[2.25rem] bg-gradient-to-br ${tone.gradient} text-6xl shadow-glow`}>✍️</div>
          <h1 className="mt-6 text-3xl font-extrabold">Етап 1 пройдено!</h1>
          <p className="mt-2 text-ink-2">Тепер напишіть слова самостійно — перекладайте з української {adverb}.</p>
        </motion.div>
        {exitSheet}
      </LessonShell>
    )
  }

  // ---------- MULTIPLE CHOICE ----------
  if (phase === 'choice') {
    return (
      <LessonShell
        header={header}
        bottom={
          <ActionBar
            feedback={feedback}
            label={checked === null ? 'Перевірити' : checked ? 'Далі' : 'Спробувати ще'}
            onClick={checked === null ? checkChoice : nextChoice}
            disabled={checked === null && !selected}
            hint="1–4 — вибрати · Enter — перевірити"
          />
        }
      >
        <AnimatePresence mode="wait">
          <motion.div key={`c-${index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
            {prompt('Як перекласти?')}
            <div key={shake} className={`mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 ${checked === false ? 'animate-shake' : ''}`}>
              {options.map((opt, i) => {
                const isSel = selected === opt
                const isRight = checked !== null && currentWord && opt === currentWord.term && checked
                const isWrong = checked === false && isSel
                const cls = isRight
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-[0_4px_0_0_theme(colors.emerald.500)]'
                  : isWrong
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-[0_4px_0_0_theme(colors.rose.500)]'
                    : isSel
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200 shadow-[0_4px_0_0_theme(colors.brand.500)]'
                      : 'border-line bg-surface text-ink shadow-[0_4px_0_0_rgb(var(--line))] hover:bg-surface-2'
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    disabled={checked !== null}
                    onClick={() => setSelected(opt)}
                    aria-pressed={isSel}
                    className={`flex min-h-[64px] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold transition-all active:translate-y-[3px] active:shadow-none disabled:active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ${cls}`}
                    lang={code}
                  >
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm ${isSel ? 'border-current' : 'border-line text-ink-3'}`}>
                      {i + 1}
                    </span>
                    <span className="break-words">{opt}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        {exitSheet}
      </LessonShell>
    )
  }

  // ---------- TYPING TEST ----------
  const isLast = index === total - 1
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checked === null) checkTyping()
    else nextTyping()
  }
  return (
    <LessonShell
      header={header}
      bottom={
        <ActionBar
          feedback={feedback}
          label={checked === null ? 'Перевірити' : isLast ? 'Завершити' : 'Далі'}
          onClick={() => (checked === null ? checkTyping() : nextTyping())}
          disabled={checked === null && !userInput.trim()}
          hint="Enter — перевірити"
        />
      }
    >
      <AnimatePresence mode="wait">
        <motion.div key={`t-${index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
          {prompt(`Напишіть ${adverb}`)}
          <form onSubmit={onSubmit} className="mt-8">
            <div key={shake} className={checked === false ? 'animate-shake' : ''}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                readOnly={checked !== null}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint={checked === null ? 'done' : 'next'}
                aria-label={`Відповідь ${adverb}`}
                lang={code}
                placeholder="Ваша відповідь…"
                className={`input py-5 text-center font-display text-2xl font-bold sm:text-3xl ${
                  checked === true
                    ? '!border-emerald-500 !ring-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : checked === false
                      ? '!border-rose-500 !ring-rose-500/20 text-rose-600 dark:text-rose-400'
                      : ''
                }`}
              />
            </div>
            <p className="mt-3 hidden text-center text-xs text-ink-3 sm:block">Enter — {checked === null ? 'перевірити' : 'далі'}</p>
          </form>
        </motion.div>
      </AnimatePresence>
      {exitSheet}
    </LessonShell>
  )
}

