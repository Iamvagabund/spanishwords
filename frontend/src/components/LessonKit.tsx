// Shared building blocks for full-screen lesson / trainer screens (BlockPage, Repeat, BlockCompletionPage).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { XMarkIcon, ArrowRightIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'
import SpeakButton from './SpeakButton'
import { getAutoSpeak, setAutoSpeak, speak, speechSupported } from '../utils/speech'
import { useActivityStore, useTodayCount } from '../store/activityStore'

export const haptic = (ok: boolean) => {
  try {
    navigator.vibrate?.(ok ? 10 : [30, 40, 30])
  } catch {
    /* unsupported */
  }
}

const PRAISE = ['Чудово!', 'Супер!', 'Так тримати!', 'Відмінно!', 'Бездоганно!', 'Ти молодець!', 'Влучно!']
export const randomPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)]

/** Full-screen lesson shell: header on top, scrollable content, sticky bottom bar. */
export function LessonShell({ header, children, bottom }: { header: ReactNode; children: ReactNode; bottom?: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="sticky top-0 z-30 pt-safe bg-app/80 backdrop-blur-xl">{header}</div>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6 pt-2">{children}</main>
      {bottom}
      <GoalCelebration />
    </div>
  )
}

export function LessonHeader({
  progress,
  onClose,
  combo = 0,
  right,
}: {
  progress: number // 0..1
  onClose: () => void
  combo?: number
  right?: ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-3 py-2.5">
      <button type="button" onClick={onClose} className="btn-icon shrink-0" aria-label="Закрити">
        <XMarkIcon className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-brand-500 via-fuchsia-500 to-orange-400"
          initial={false}
          animate={{ width: `${Math.max(progress * 100, progress > 0 ? 4 : 0)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
        </motion.div>
      </div>
      {right}
      <DailyGoalBadge />
      <ComboBadge combo={combo} />
    </div>
  )
}

export function ComboBadge({ combo }: { combo: number }) {
  const hot = combo >= 2
  return (
    <motion.div
      key={combo}
      initial={combo > 0 ? { scale: 1.4 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      className={`flex min-w-[3.25rem] shrink-0 items-center justify-center gap-0.5 rounded-full px-2 py-1 text-sm font-extrabold tabular-nums ${
        hot ? 'bg-orange-500/15 text-orange-500' : 'text-ink-3'
      }`}
      title="Правильних поспіль"
    >
      <span className={hot ? '' : 'grayscale opacity-60'}>🔥</span>
      {combo}
    </motion.div>
  )
}

/** Compact daily-goal ring shown in lesson headers. */
export function DailyGoalBadge() {
  const today = useTodayCount()
  const goal = useActivityStore(s => s.dailyGoal)
  const pct = Math.min(today / Math.max(goal, 1), 1)
  const done = today >= goal
  const r = 9
  const c = 2 * Math.PI * r
  return (
    <div
      className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold tabular-nums min-[380px]:flex ${done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-ink-3'}`}
      title={`Щоденна ціль: ${today}/${goal} слів`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90" aria-hidden>
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="3.5" className="stroke-line" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={`transition-[stroke-dashoffset] duration-500 ${done ? 'stroke-emerald-500' : 'stroke-brand-500'}`}
        />
      </svg>
      {today}/{goal}
    </div>
  )
}

/** Toast + confetti once per day when the daily goal is reached. */
export function GoalCelebration() {
  const show = useActivityStore(s => s.justReachedGoal)
  const goal = useActivityStore(s => s.dailyGoal)
  const dismiss = useActivityStore(s => s.dismissCelebration)
  useEffect(() => {
    if (!show) return
    const t = setTimeout(dismiss, 4000)
    return () => clearTimeout(t)
  }, [show, dismiss])
  return (
    <>
      {show && <Confetti />}
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            onClick={dismiss}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-3xl bg-gradient-to-r from-orange-500 to-rose-500 p-4 pt-safe text-left text-white shadow-glow"
            role="status"
          >
            <span className="text-3xl">🏆</span>
            <span>
              <span className="block font-display text-lg font-extrabold">Ціль на сьогодні виконано!</span>
              <span className="text-sm opacity-90">{goal} слів — так тримати 🔥</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

export type Feedback = {
  ok: boolean
  title?: string
  answer?: string
  example?: string
  exampleTranslation?: string
  lang?: string
  /** text to pronounce (correct term); auto-spoken when the toggle is on */
  speak?: string
} | null

function AutoSpeakToggle() {
  const [on, setOn] = useState(getAutoSpeak)
  return (
    <button
      type="button"
      onClick={() => {
        setAutoSpeak(!on)
        setOn(!on)
      }}
      aria-pressed={on}
      className={`chip shrink-0 transition active:scale-95 ${on ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-surface-2 text-ink-3'}`}
      title="Автоматично озвучувати правильну відповідь"
    >
      {on ? '🔊' : '🔇'} Автоозвучення
    </button>
  )
}

/** Sticky bottom action bar that becomes the green/red feedback sheet after checking. */
export function ActionBar({
  feedback,
  label,
  onClick,
  disabled,
  hint,
  secondary,
}: {
  feedback: Feedback
  label: string
  onClick: () => void
  disabled?: boolean
  hint?: string
  secondary?: ReactNode
}) {
  const speakText = feedback?.speak
  const speakLang = feedback?.lang ?? 'es'
  useEffect(() => {
    if (speakText && getAutoSpeak()) speak(speakText, speakLang)
  }, [speakText, speakLang])
  const tone = feedback ? (feedback.ok ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-rose-500/15 border-rose-500/30') : 'border-line/60'
  const btn = feedback ? (feedback.ok ? 'btn-success' : 'btn-danger') : 'btn-primary'
  return (
    <div className={`sticky bottom-0 z-30 border-t pb-safe backdrop-blur-xl transition-colors duration-300 ${feedback ? '' : 'bg-surface/80'} ${tone}`}>
      <div className={`${feedback ? (feedback.ok ? 'bg-emerald-50/90 dark:bg-emerald-950/70' : 'bg-rose-50/90 dark:bg-rose-950/70') : ''}`}>
        <div className="mx-auto w-full max-w-xl px-4 py-4">
          <AnimatePresence initial={false}>
            {feedback && (
              <motion.div
                key="fb"
                initial={{ height: 0, opacity: 0, y: 24 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="overflow-hidden"
                role="status"
                aria-live="polite"
              >
                <div className={`mb-4 flex items-start gap-3 ${feedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.05 }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-black text-white ${feedback.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  >
                    {feedback.ok ? '✓' : '✗'}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl font-extrabold">{feedback.title ?? (feedback.ok ? randomPraise() : 'Правильно:')}</p>
                    {feedback.answer && (
                      <p className="text-lg font-bold break-words" lang={feedback.lang}>{feedback.answer}</p>
                    )}
                    {feedback.example && (
                      <div className="mt-1 text-sm text-ink-2">
                        <p className="italic" lang={feedback.lang}>{feedback.example}</p>
                        {feedback.exampleTranslation && <p className="text-ink-3">{feedback.exampleTranslation}</p>}
                      </div>
                    )}
                  </div>
                  {feedback.speak && speechSupported && (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <SpeakButton text={feedback.speak} lang={speakLang} />
                    </div>
                  )}
                </div>
                {feedback.speak && speechSupported && (
                  <div className="-mt-2 mb-3 flex justify-end">
                    <AutoSpeakToggle />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3">
            {secondary}
            <button type="button" onClick={onClick} disabled={disabled} className={`btn btn-lg ${btn} flex-1 uppercase tracking-wide`}>
              {label}
            </button>
          </div>
          {hint && !feedback && <p className="mt-2 hidden text-center text-xs text-ink-3 sm:block">{hint}</p>}
        </div>
      </div>
    </div>
  )
}

/** Bottom sheet asking to confirm leaving a lesson. */
export function ExitSheet({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onStay()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onStay])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onStay} />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative w-full max-w-md rounded-t-4xl border border-line bg-surface p-6 pb-safe text-center shadow-lift sm:rounded-4xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />
            <div className="text-5xl">😢</div>
            <h2 className="mt-3 text-xl font-extrabold">Вийти з уроку?</h2>
            <p className="mt-1 text-ink-2">Прогрес уроку буде втрачено</p>
            <div className="mt-6 flex flex-col gap-3 pb-4">
              <button className="btn btn-lg btn-primary" onClick={onStay} autoFocus>
                Продовжити урок
              </button>
              <button className="btn btn-lg btn-ghost text-rose-500" onClick={onLeave}>
                Вийти
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Lightweight canvas confetti burst. */
export function Confetti({ run = true }: { run?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!run) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    const colors = ['#7c4dff', '#d946ef', '#fb923c', '#10b981', '#38bdf8', '#facc15', '#f43f5e']
    const W = canvas.width
    const H = canvas.height
    const parts = Array.from({ length: 160 }, (_, i) => {
      const fromLeft = i % 2 === 0
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9
      const speed = (12 + Math.random() * 14) * dpr
      return {
        x: fromLeft ? 0 : W,
        y: H * 0.75,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: (6 + Math.random() * 6) * dpr,
        h: (8 + Math.random() * 8) * dpr,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length],
      }
    })
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const elapsed = t - start
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 2200) / 800)
      for (const p of parts) {
        p.vy += 0.45 * dpr
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)))
        ctx.restore()
      }
      if (elapsed < 3000) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run])
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40 h-full w-full" aria-hidden />
}

export function CountUp({ to, duration = 1.1, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: x => setV(Math.round(x)) })
    return () => c.stop()
  }, [to, duration])
  return (
    <>
      {v}
      {suffix}
    </>
  )
}

export const starsFor = (pct: number) => (pct >= 100 ? 3 : pct >= 85 ? 2 : pct >= 70 ? 1 : 0)

export const formatTime = (ms: number) => {
  const s = Math.round(ms / 1000)
  return s >= 60 ? `${Math.floor(s / 60)} хв ${s % 60} с` : `${s} с`
}

export interface MistakeItem {
  id: string
  translation: string
  term: string
  answer?: string
}

/** Celebratory results screen. */
export function ResultScreen({
  percent,
  score10,
  passed,
  title,
  subtitle,
  emoji,
  gradient,
  chips,
  mistakes,
  lang,
  onNext,
  onRetry,
  onHome,
  note,
}: {
  percent: number
  score10: number
  passed: boolean
  title: string
  subtitle?: string
  emoji: string
  gradient: string
  chips: { icon: string; label: string; value: string }[]
  mistakes: MistakeItem[]
  lang: string
  onNext?: () => void
  onRetry: () => void
  onHome: () => void
  note?: string
}) {
  const stars = starsFor(percent)
  const heading = !passed ? 'Майже! Спробуй ще раз' : percent >= 100 ? 'Бездоганно!' : percent >= 85 ? 'Відмінно!' : 'Урок пройдено!'
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {passed && <Confetti />}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-safe">
        <div className="pt-8 text-center">
          <motion.div
            initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-[2.25rem] bg-gradient-to-br ${gradient} text-6xl shadow-glow`}
          >
            {passed ? (percent >= 100 ? '🏆' : '🎉') : '💪'}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 text-3xl font-extrabold sm:text-4xl">
            {heading}
          </motion.h1>
          <p className="mt-1 text-ink-2">
            {emoji} {title}
            {subtitle && <span className="text-ink-3" lang={lang}> · {subtitle}</span>}
          </p>

          <div className="mt-6 flex justify-center gap-2" aria-label={`${stars} з 3 зірок`}>
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.5 + i * 0.18 }}
                className={`text-5xl ${i === 1 ? '-translate-y-2' : ''} ${i < stars ? 'drop-shadow-[0_4px_12px_rgba(250,204,21,.6)]' : 'opacity-25 grayscale'}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          <div className="mt-4 font-display text-7xl font-extrabold tabular-nums">
            <span className={passed ? 'text-gradient' : 'text-rose-500'}>
              <CountUp to={Math.round(percent)} suffix="%" />
            </span>
          </div>
          <p className="text-sm font-semibold text-ink-3">бал {score10}/10</p>
          {note && <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-300">{note}</p>}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {chips.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="card px-2 py-3 text-center"
            >
              <div className="text-xl">{c.icon}</div>
              <div className="font-display text-lg font-extrabold tabular-nums">{c.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{c.label}</div>
            </motion.div>
          ))}
        </div>

        {mistakes.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-3">Над цим попрацюй · {mistakes.length}</h2>
            <ul className="space-y-2">
              {mistakes.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3"
                >
                  <span className="text-rose-500">✗</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{m.translation}</div>
                    <div className="break-words text-sm text-ink-2">
                      {m.answer && <span className="mr-1 text-ink-3 line-through">{m.answer}</span>}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400" lang={lang}>{m.term}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex-1" />
      </main>
      <div className="sticky bottom-0 z-30 border-t border-line/60 bg-surface/80 pb-safe backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-4">
          {passed && onNext && (
            <button className="btn btn-lg btn-primary" onClick={onNext} autoFocus>
              Наступний блок <ArrowRightIcon className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button className={`btn ${passed ? 'btn-secondary' : 'btn-primary'}`} onClick={onRetry} autoFocus={!passed || !onNext}>
              <ArrowPathIcon className="h-5 w-5" strokeWidth={2.5} /> Пройти ще раз
            </button>
            <button className="btn btn-secondary" onClick={onHome}>
              <HomeIcon className="h-5 w-5" strokeWidth={2.5} /> На головну
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
