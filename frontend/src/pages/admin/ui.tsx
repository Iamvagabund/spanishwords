import { type ReactNode, useCallback, useEffect, useState } from 'react'

export const card = 'card p-4 sm:p-6'
export const input = 'input !py-2.5 text-sm'
export const btn = 'btn !px-4 !py-2.5 text-sm'
export const btnPrimary = `${btn} btn-primary`
export const btnGhost = `${btn} btn-secondary`
export const btnDanger = `${btn} btn-danger`
export const iconBtn = 'btn-icon h-10 w-10 disabled:pointer-events-none disabled:opacity-30'
export const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-3'
export const chip = 'chip bg-surface-2 text-ink-2'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2 ${className}`} />
}

export function Spinner({ label = 'Завантаження…', rows = 4 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
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
  const [cls, icon] = {
    error: ['border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300', '⚠️'],
    success: ['border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', '✅'],
    info: ['border-line bg-surface-2 text-ink-2', 'ℹ️'],
  }[kind]
  return (
    <div className={`flex animate-pop-in items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${cls}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {onClose && (
        <button onClick={onClose} className="-my-1 shrink-0 rounded-lg px-1.5 opacity-60 hover:opacity-100" aria-label="Закрити">
          ✕
        </button>
      )}
    </div>
  )
}

export function Empty({ children, emoji = '🗂️' }: { children: ReactNode; emoji?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-sm text-ink-2">
      <div className="bg-brand-gradient flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-glow">
        {emoji}
      </div>
      {children}
    </div>
  )
}

/** Centered dialog on desktop, bottom sheet on mobile. */
export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="pb-safe relative w-full animate-pop-in rounded-t-4xl border border-line bg-surface shadow-lift sm:max-w-md sm:rounded-4xl">
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmOpts {
  title: string
  text?: ReactNode
  confirm?: string
  danger?: boolean
  emoji?: string
}

/** Promise-based confirmation dialog, replacement for window.confirm. */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), [])
  const close = useCallback(
    (v: boolean) =>
      setState((s) => {
        s?.resolve(v)
        return null
      }),
    [],
  )
  const cancel = useCallback(() => close(false), [close])
  const node = (
    <Dialog open={!!state} onClose={cancel}>
      {state && (
        <div className="text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
              state.danger ? 'bg-rose-500/15' : 'bg-brand-500/15'
            }`}
          >
            {state.emoji ?? (state.danger ? '🗑️' : '❓')}
          </div>
          <h3 className="text-lg font-bold text-ink">{state.title}</h3>
          {state.text && <p className="mt-2 text-sm text-ink-2">{state.text}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button className="btn btn-secondary flex-1" onClick={cancel}>
              Скасувати
            </button>
            <button className={`btn flex-1 ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>
              {state.confirm ?? 'Підтвердити'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  )
  return { ask, node }
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
