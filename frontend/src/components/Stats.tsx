import { motion } from 'framer-motion'
import {
  TrophyIcon,
  Squares2X2Icon,
  ChartBarIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'

type Tone = 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'

const toneGradient: Record<Tone, string> = {
  violet: 'from-violet-500 to-fuchsia-500',
  emerald: 'from-emerald-400 to-teal-500',
  amber: 'from-amber-300 to-orange-500',
  rose: 'from-pink-400 to-rose-500',
  sky: 'from-sky-400 to-indigo-500',
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'violet',
  index = 0,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  tone?: Tone
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card relative overflow-hidden rounded-3xl p-4"
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${toneGradient[tone]} opacity-20 blur-xl`}
      />
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${toneGradient[tone]} text-white shadow-soft`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="text-sm font-medium text-ink-2">{label}</p>
    </motion.div>
  )
}

/** Circular progress ring. `value` 0..1. Colour comes from `className` (currentColor). */
export function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  className = 'text-white',
  trackClassName = 'text-white/25',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  trackClassName?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className={trackClassName} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeLinecap="round"
          className={className}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function useProgressSummary(lang: string) {
  const userProgress = useLangProgress(lang)
  const completed = userProgress.completedBlocks || []
  const mistakes = userProgress.mistakes || {}
  return {
    level: userProgress.currentLevel || 1,
    completedBlocks: completed.length,
    averageScore: completed.length ? Math.round((userProgress.averageScore || 0) * 10) / 10 : 0,
    learnedWords: (userProgress.learnedWords || []).length,
    mistakes: Object.values(mistakes).filter(n => n > 0).length,
  }
}

export default function Stats({ lang }: { lang: string }) {
  const s = useProgressSummary(lang)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatTile index={0} label="Рівень" value={s.level} icon={TrophyIcon} tone="amber" />
      <StatTile index={1} label="Блоків пройдено" value={s.completedBlocks} icon={Squares2X2Icon} tone="violet" />
      <StatTile index={2} label="Середній бал" value={`${s.averageScore}/10`} icon={ChartBarIcon} tone="emerald" />
      <StatTile index={3} label="Вивчено слів" value={s.learnedWords} icon={BookOpenIcon} tone="sky" />
      <StatTile index={4} label="Слів з помилками" value={s.mistakes} icon={ExclamationCircleIcon} tone="rose" />
    </div>
  )
}
