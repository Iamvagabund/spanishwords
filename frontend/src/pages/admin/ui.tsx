import { type ReactNode, useCallback, useEffect, useState } from 'react'

export const card =
  'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
export const input =
  'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
export const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50'
export const btnPrimary = `${btn} bg-indigo-600 text-white hover:bg-indigo-500`
export const btnGhost = `${btn} border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800`
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-500`
export const iconBtn =
  'rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'

export function Spinner({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-zinc-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      {label}
    </div>
  )
}

export function Message({
  kind = 'error',
  children,
  onClose,
}: {
  kind?: 'error' | 'success' | 'info'
  children: ReactNode
  onClose?: () => void
}) {
  const cls = {
    error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
    success:
      'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    info: 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  }[kind]
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <div className="min-w-0 break-words">{children}</div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Закрити">
          ✕
        </button>
      )}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-zinc-500">{children}</div>
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Невідома помилка')

/** Simple async loader hook. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps)
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await load())
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [load])
  useEffect(() => {
    reload()
  }, [reload])
  return { data, setData, loading, error, reload }
}

/** Inline flash message state. */
export function useFlash() {
  const [flash, setFlash] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const node = flash ? (
    <Message kind={flash.kind} onClose={() => setFlash(null)}>
      {flash.text}
    </Message>
  ) : null
  return {
    node,
    ok: (text: string) => setFlash({ kind: 'success', text }),
    fail: (e: unknown) => setFlash({ kind: 'error', text: errMsg(e) }),
    clear: () => setFlash(null),
  }
}
