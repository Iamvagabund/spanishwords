import {
  TrophyIcon,
  Squares2X2Icon,
  ChartBarIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'

type Tone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'zinc'

const toneClasses: Record<Tone, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  zinc: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
}: {
  label: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  tone?: Tone
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
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
      <StatTile label="Рівень" value={s.level} icon={TrophyIcon} tone="amber" />
      <StatTile label="Блоків пройдено" value={s.completedBlocks} icon={Squares2X2Icon} tone="indigo" />
      <StatTile label="Середній бал" value={`${s.averageScore}/10`} icon={ChartBarIcon} tone="emerald" />
      <StatTile label="Вивчено слів" value={s.learnedWords} icon={BookOpenIcon} tone="zinc" />
      <StatTile label="Слів з помилками" value={s.mistakes} icon={ExclamationCircleIcon} tone="rose" />
    </div>
  )
}
