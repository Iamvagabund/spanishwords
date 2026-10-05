import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowPathIcon, ExclamationTriangleIcon, MoonIcon } from '@heroicons/react/24/outline'

const SLOW_AFTER_MS = 4000

/** Shows a friendly hint when the (free-tier) backend takes a while to wake up. */
export function SlowServerHint({ delay = SLOW_AFTER_MS }: { delay?: number }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!slow) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-zinc-600 dark:text-zinc-300"
    >
      <MoonIcon className="h-5 w-5 shrink-0 animate-pulse text-indigo-500" />
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">Сервер прокидається…</p>
        <p>Безкоштовний сервер засинає без активності. Перший запуск може тривати до хвилини — дякуємо за терпіння!</p>
      </div>
    </motion.div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`} />
}

/** Generic page skeleton: header + grid of cards. */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-8 py-6 sm:py-10" aria-busy="true" aria-label="Завантаження">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <SlowServerHint />
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  title = 'Не вдалося завантажити дані',
}: {
  message?: string | null
  onRetry?: () => void
  title?: string
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <ExclamationTriangleIcon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
      {message && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        >
          <ArrowPathIcon className="h-5 w-5" /> Спробувати ще раз
        </button>
      )}
    </div>
  )
}
