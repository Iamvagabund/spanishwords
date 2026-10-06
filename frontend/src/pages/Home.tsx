import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckIcon,
  LockClosedIcon,
  PlayIcon,
  StarIcon,
  XMarkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid'
import { useLangProgress } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { useLang } from '../context/LangContext'
import { blockState, langAdverb } from '../utils/lang'
import { blockEmoji, blockTone, languageTone } from '../theme/palette'
import { ProgressRing } from '../components/Stats'
import type { Block, CompletedBlock } from '../types'
import TodayWidget from '../components/TodayWidget'
import { GoalCelebration } from '../components/LessonKit'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Доброї ночі'
  if (h < 12) return 'Доброго ранку'
  if (h < 18) return 'Доброго дня'
  return 'Доброго вечора'
}

/** 1–3 stars from a 1–10 score. */
const starsFor = (score: number) => (score >= 9 ? 3 : score >= 7 ? 2 : 1)

function Stars({ score, className = 'h-4 w-4' }: { score: number; className?: string }) {
  const n = starsFor(score)
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} з 3 зірок`}>
      {[0, 1, 2].map(i => (
        <StarIcon key={i} className={`${className} ${i < n ? 'text-amber-400 drop-shadow' : 'text-ink-3/40'}`} />
      ))}
    </span>
  )
}

// Horizontal offsets (px) of the winding path, repeating.
const WAVE = [0, 52, 78, 52, 0, -52, -78, -52]

export default function Home() {
  const { code, language, blocks: rawBlocks } = useLang()
  const userProgress = useLangProgress(code)
  const user = useAuthStore(s => s.user)
  const { sorted: blocks, completed, isLocked, next: nextBlock } = blockState(rawBlocks, userProgress)
  const [selected, setSelected] = useState<Block | null>(null)

  const completedCount = blocks.filter(b => completed.has(b.id)).length
  const total = blocks.length
  const ratio = total ? completedCount / total : 0
  const avg = Math.round((userProgress.averageScore || 0) * 10) / 10
  const learned = userProgress.learnedWords.length
  const mistakeCount = Object.values(userProgress.mistakes || {}).filter(n => n > 0).length
  const tone = languageTone(code)
  const name = user?.nickname?.trim()

  // group by level, keeping order
  const groups: { level: string; blocks: Block[] }[] = []
  blocks.forEach(b => {
    const last = groups[groups.length - 1]
    if (last && last.level === b.level) last.blocks.push(b)
    else groups.push({ level: b.level, blocks: [b] })
  })

  let pathIndex = 0

  return (
    <div className="space-y-6 py-4 sm:py-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-4xl bg-gradient-to-br ${tone.gradient} p-5 text-white shadow-lift sm:p-8`}
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
        <div className="pointer-events-none absolute right-6 top-4 select-none text-7xl opacity-20 sm:text-8xl" aria-hidden>
          {language.flag}
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/80">
              {greeting()}
              {name ? `, ${name}` : ''} 👋
            </p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">
              {language.name}
            </h1>
            <p className="mt-1 max-w-md text-sm text-white/85 sm:text-base">
              {nextBlock
                ? `Вивчаємо слова ${langAdverb(language)} — крок за кроком.`
                : total
                  ? 'Усі блоки пройдено. Ти неймовірний! 🎉'
                  : 'Блоків для цієї мови ще немає.'}
            </p>
          </div>
          <ProgressRing value={ratio} size={92} stroke={9}>
            <span className="font-display text-xl font-extrabold leading-none">{Math.round(ratio * 100)}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">курс</span>
          </ProgressRing>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { e: '🏆', v: `Рівень ${userProgress.currentLevel ?? 1}`, l: 'поточний' },
            { e: '🔥', v: `${completedCount}/${total}`, l: 'блоків' },
            { e: '📚', v: learned, l: 'слів вивчено' },
            { e: '⭐', v: completedCount ? `${avg}/10` : '—', l: 'середній бал' },
          ].map(s => (
            <div key={s.l} className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
              <p className="font-display text-lg font-extrabold leading-tight">
                <span aria-hidden>{s.e}</span> {s.v}
              </p>
              <p className="text-xs font-medium text-white/80">{s.l}</p>
            </div>
          ))}
        </div>

        {nextBlock && (
          <Link
            to={`/${code}/block/${nextBlock.order}`}
            className="relative mt-5 flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-[0_5px_0_rgb(0_0_0/0.18)] transition active:translate-y-1 active:shadow-none dark:text-zinc-900"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${blockTone(nextBlock.order).gradient} text-2xl`}
              aria-hidden
            >
              {blockEmoji(nextBlock.title)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
                {completedCount ? 'Продовжити' : 'Почати навчання'}
              </span>
              <span className="block truncate font-display text-lg font-extrabold text-zinc-900">{nextBlock.title}</span>
            </span>
            <PlayIcon className="h-7 w-7 shrink-0 text-zinc-900" />
          </Link>
        )}
      </motion.section>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        {/* PATH */}
        <section aria-label="Шлях навчання" className="space-y-6">
          {user && <TodayWidget className="lg:hidden" />}
          {mistakeCount > 0 && <ReviewCard code={code} count={mistakeCount} className="lg:hidden" />}
          {groups.length === 0 && (
            <div className="card rounded-3xl p-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gradient text-3xl">📭</div>
              <p className="font-display text-lg font-bold text-ink">Блоків ще немає</p>
              <p className="text-sm text-ink-2">Загляньте трохи пізніше.</p>
            </div>
          )}
          {groups.map(group => {
            const doneInGroup = group.blocks.filter(b => completed.has(b.id)).length
            return (
              <div key={group.level + group.blocks[0].id}>
                <div className="card mb-6 flex items-center gap-3 rounded-3xl p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient font-display text-lg font-extrabold text-white shadow-glow">
                    {group.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-extrabold text-ink">Рівень {group.level}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="progress-track h-2">
                        <div className="progress-fill" style={{ width: `${(doneInGroup / group.blocks.length) * 100}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-ink-2">
                        {doneInGroup}/{group.blocks.length}
                      </span>
                    </div>
                  </div>
                </div>

                <ol className="flex flex-col items-center gap-5">
                  {group.blocks.map(block => {
                    const idx = pathIndex++
                    return (
                      <PathNode
                        key={block.id}
                        block={block}
                        index={idx}
                        offset={WAVE[idx % WAVE.length]}
                        done={completed.get(block.id)}
                        locked={isLocked(block)}
                        current={nextBlock?.id === block.id}
                        onSelect={() => setSelected(block)}
                      />
                    )
                  })}
                </ol>
              </div>
            )
          })}
          {total > 0 && !nextBlock && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-4xl shadow-lift">🏆</div>
              <p className="font-display text-lg font-extrabold text-ink">Курс завершено!</p>
            </div>
          )}
        </section>

        {/* SIDE PANEL (desktop) */}
        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
          {user && <TodayWidget />}
          <div className="card rounded-3xl p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-ink-3">Ціль курсу</p>
            <div className="mt-3 flex items-center gap-4">
              <ProgressRing value={ratio} size={84} stroke={9} className="text-brand-500" trackClassName="text-surface-2">
                <span className="font-display text-lg font-extrabold text-ink">{Math.round(ratio * 100)}%</span>
              </ProgressRing>
              <div>
                <p className="font-display text-xl font-extrabold text-ink">
                  {completedCount} з {total}
                </p>
                <p className="text-sm text-ink-2">блоків пройдено</p>
              </div>
            </div>
          </div>
          <div className="card grid grid-cols-2 gap-3 rounded-3xl p-5">
            <div>
              <p className="font-display text-2xl font-extrabold text-ink">{learned}</p>
              <p className="text-sm text-ink-2">слів вивчено</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-ink">{completedCount ? avg : '—'}</p>
              <p className="text-sm text-ink-2">середній бал</p>
            </div>
            <Link to={`/${code}/stats`} className="btn btn-secondary col-span-2 mt-1">
              <ChartBarIcon className="h-5 w-5" /> Статистика
            </Link>
          </div>
          {mistakeCount > 0 && <ReviewCard code={code} count={mistakeCount} />}
        </aside>
      </div>

      <GoalCelebration />
      <BlockSheet
        block={selected}
        code={code}
        done={selected ? completed.get(selected.id) : undefined}
        locked={selected ? isLocked(selected) : false}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function ReviewCard({ code, count, className = '' }: { code: string; count: number; className?: string }) {
  return (
    <Link
      to={`/${code}/review`}
      className={`card card-interactive flex items-center gap-4 rounded-3xl border-rose-500/30 p-4 ${className}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-soft">
        <ArrowPathIcon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-extrabold text-ink">Повторити помилки</span>
        <span className="block text-sm text-ink-2">
          {count} {count === 1 ? 'слово чекає' : 'слів чекають'} на тебе 💪
        </span>
      </span>
      <span className="chip bg-rose-500/15 text-rose-600 dark:text-rose-300">{count}</span>
    </Link>
  )
}

function PathNode({
  block,
  index,
  offset,
  done,
  locked,
  current,
  onSelect,
}: {
  block: Block
  index: number
  offset: number
  done?: CompletedBlock
  locked: boolean
  current: boolean
  onSelect: () => void
}) {
  const tone = blockTone(block.order)
  const size = current ? 'h-24 w-24 text-4xl' : 'h-20 w-20 text-3xl'
  const face = locked
    ? 'bg-surface-2 text-ink-3 shadow-[0_6px_0_rgb(var(--line))]'
    : `bg-gradient-to-br ${tone.gradient} text-white shadow-[0_6px_0_rgb(0_0_0/0.22)]`

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.85, x: offset }}
      animate={{ opacity: 1, scale: 1, x: offset }}
      transition={{ delay: Math.min(index * 0.04, 0.5), type: 'spring', stiffness: 260, damping: 20 }}
      className="relative flex flex-col items-center"
    >
      {current && (
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-2 rounded-2xl bg-surface px-3 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-brand-600 shadow-lift ring-2 ring-brand-500/40 dark:text-brand-300"
        >
          Почати
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-surface" />
        </motion.div>
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${block.title}${locked ? ' (заблоковано)' : done ? ' (пройдено)' : ''}`}
        className="relative rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50"
      >
        {current && <span className={`absolute inset-0 animate-ping rounded-full ring-4 ${tone.ring} opacity-40`} />}
        {current && <span className={`absolute -inset-2 rounded-full ring-4 ${tone.ring} opacity-60`} />}
        <span
          className={`relative flex ${size} items-center justify-center rounded-full transition active:translate-y-1.5 active:shadow-none ${face}`}
        >
          {locked ? (
            <LockClosedIcon className="h-8 w-8" />
          ) : (
            <span aria-hidden className={done ? 'opacity-90' : ''}>
              {blockEmoji(block.title)}
            </span>
          )}
          {done && (
            <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-app">
              <CheckIcon className="h-4 w-4" />
            </span>
          )}
        </span>
      </button>
      <div className="mt-2 max-w-[9rem] text-center">
        {done && <Stars score={done.score} className="h-4 w-4" />}
        <p className={`truncate text-sm font-bold ${locked ? 'text-ink-3' : 'text-ink'}`}>{block.title}</p>
      </div>
    </motion.li>
  )
}

function BlockSheet({
  block,
  code,
  done,
  locked,
  onClose,
}: {
  block: Block | null
  code: string
  done?: CompletedBlock
  locked: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!block) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [block, onClose])

  return (
    <AnimatePresence>
      {block && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={block.title}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-4xl bg-surface shadow-lift sm:rounded-4xl"
          >
            <div className={`relative bg-gradient-to-br ${blockTone(block.order).gradient} px-5 pb-5 pt-4 text-white`}>
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/50 sm:hidden" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 active:scale-95"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl" aria-hidden>
                  {blockEmoji(block.title)}
                </span>
                <div className="min-w-0 pr-8">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                    Блок {block.order} · {block.level}
                  </p>
                  <h2 className="truncate text-2xl font-extrabold">{block.title}</h2>
                  <p className="truncate text-white/85" lang={code}>
                    {block.titleTarget}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 pb-safe">
              {block.description && <p className="text-sm text-ink-2">{block.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="font-display text-xl font-extrabold text-ink">{block.words.length}</p>
                  <p className="text-xs font-medium text-ink-2">слів</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-3">
                  {done ? (
                    <>
                      <p className="font-display text-xl font-extrabold text-ink">{done.score}/10</p>
                      <Stars score={done.score} className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <p className="font-display text-xl font-extrabold text-ink">—</p>
                      <p className="text-xs font-medium text-ink-2">найкращий бал</p>
                    </>
                  )}
                </div>
              </div>
              {locked ? (
                <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-4 text-sm font-semibold text-ink-2">
                  <LockClosedIcon className="h-5 w-5 shrink-0" /> Спершу пройдіть попередній блок
                </div>
              ) : (
                <Link
                  to={`/${code}/block/${block.order}`}
                  className={`btn btn-lg w-full ${done ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {done ? <ArrowPathIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                  {done ? 'Повторити' : 'Почати'}
                </Link>
              )}
              <div className="h-2 sm:hidden" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
