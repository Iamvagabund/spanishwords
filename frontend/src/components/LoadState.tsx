import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

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
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      role="status"
      className="card mx-auto mt-6 flex max-w-md items-center gap-4 p-4"
    >
      <motion.span
        animate={{ rotate: [-8, 8, -8], y: [0, -3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-3xl shadow-soft"
        aria-hidden
      >
        ☕
      </motion.span>
      <div className="min-w-0 text-sm">
        <p className="font-display text-base font-extrabold">Сервер прокидається… ☕</p>
        <p className="text-ink-2">Безкоштовний сервер засинає без активності. Перший запуск може тривати до хвилини.</p>
      </div>
    </motion.div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2 ${className}`} />
}

/** Generic page skeleton: hero card + grid of block cards. */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6 py-2 sm:py-4" aria-busy="true" aria-label="Завантаження">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-3xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-5 h-3 w-full rounded-full" />
          </div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mx-auto mt-10 max-w-md p-8 text-center"
    >
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-4xl shadow-soft" aria-hidden>
        🙈
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {message && <p className="mt-2 text-sm text-ink-2">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary mt-6 w-full sm:w-auto">
          <ArrowPathIcon className="h-5 w-5" /> Спробувати ще раз
        </button>
      )}
    </motion.div>
  )
}
