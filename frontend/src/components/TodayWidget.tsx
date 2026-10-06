import { motion } from 'framer-motion'
import { useActivityStore, useStreak, useTodayCount } from '../store/activityStore'
import { addDays, localDate } from '../services/activity'

const WEEKDAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const daysWord = (n: number) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дні'
  return 'днів'
}

/** "Сьогодні": daily-goal ring, streak and the last 7 days. */
export default function TodayWidget({ className = '' }: { className?: string }) {
  const today = useTodayCount()
  const goal = useActivityStore(s => s.dailyGoal)
  const activity = useActivityStore(s => s.activity)
  const streak = useStreak()
  const pct = Math.min(today / Math.max(goal, 1), 1)
  const done = today >= goal
  const size = 76
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const now = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6)
    const key = localDate(d)
    const n = activity[key] ?? 0
    return { key, label: WEEKDAYS[d.getDay()], n, met: n >= goal, isToday: i === 6 }
  })

  return (
    <section className={`card rounded-3xl p-4 sm:p-5 ${className}`} aria-label="Сьогодні">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden>
            <defs>
              <linearGradient id="goal-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={done ? '#10b981' : '#7c4dff'} />
                <stop offset="100%" stopColor={done ? '#34d399' : '#f97316'} />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke="url(#goal-grad)"
              strokeDasharray={c}
              initial={false}
              animate={{ strokeDashoffset: c * (1 - pct) }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <span className="text-2xl">✅</span>
            ) : (
              <>
                <span className="font-display text-lg font-extrabold leading-none text-ink tabular-nums">{today}</span>
                <span className="text-[10px] font-bold text-ink-3">з {goal}</span>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Сьогодні</p>
          <p className="font-display text-lg font-extrabold leading-tight text-ink">
            {done ? 'Ціль виконано! 🎉' : `${today}/${goal} слів`}
          </p>
          <p className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-extrabold ${streak > 0 ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'bg-surface-2 text-ink-3'}`}>
            <span className={streak > 0 ? '' : 'grayscale opacity-60'}>🔥</span>
            {streak > 0 ? `${streak} ${daysWord(streak)} поспіль` : 'Почни серію'}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {week.map(d => (
          <div key={d.key} className="flex flex-col items-center gap-1" title={`${d.key}: ${d.n} слів`}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
                d.met
                  ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-soft'
                  : d.n > 0
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300'
                    : 'bg-surface-2 text-ink-3'
              } ${d.isToday ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface' : ''}`}
            >
              {d.met ? '🔥' : d.n > 0 ? d.n : ''}
            </span>
            <span className={`text-[10px] font-bold ${d.isToday ? 'text-brand-600 dark:text-brand-300' : 'text-ink-3'}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
