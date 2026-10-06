import { useMemo, useState } from 'react'
import { adminApi, type AdminUser, type LangProgressSummary, userId } from '../../services/adminApi'
import { useAuthStore } from '../../store/authStore'
import { languageTone } from '../../theme/palette'
import { btnGhost, Empty, input, Message, Spinner, useConfirm, useFlash, useLoad } from './ui'

const count = (v: unknown) => (Array.isArray(v) ? v.length : typeof v === 'number' ? v : 0)

function ProgressSummary({ progress }: { progress?: Record<string, LangProgressSummary> }) {
  const entries = Object.entries(progress ?? {})
  if (!entries.length) return <span className="text-xs text-ink-3">Без прогресу</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([code, p]) => (
        <span
          key={code}
          className={`chip ${languageTone(code).soft} ${languageTone(code).text} !font-semibold`}
          title={`Вивчено слів: ${count(p.learnedWords)}`}
        >
          <b className="uppercase">{code}</b>: {count(p.completedBlocks)} бл. · {Number(p.averageScore || 0).toFixed(1)}
        </span>
      ))}
    </div>
  )
}

export default function AdminUsers() {
  const users = useLoad(() => adminApi.getUsers(), [])
  const flash = useFlash()
  const dialog = useConfirm()
  const me = useAuthStore((s) => (s.user as { id?: string } | null)?.id)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [resetLang, setResetLang] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = users.data ?? []
    return t
      ? list.filter((u) => u.email.toLowerCase().includes(t) || (u.nickname ?? '').toLowerCase().includes(t))
      : list
  }, [users.data, q])

  const patchLocal = (id: string, fn: (u: AdminUser) => AdminUser) =>
    users.setData((list) => list?.map((u) => (userId(u) === id ? fn(u) : u)) ?? null)

  const toggleRole = async (u: AdminUser) => {
    const id = userId(u)
    const role = u.role === 'admin' ? 'user' : 'admin'
    const ok = await dialog.ask({
      title: role === 'admin' ? 'Надати права адміна?' : 'Забрати права адміна?',
      text: u.email,
      confirm: role === 'admin' ? 'Надати' : 'Забрати',
      emoji: '🛡️',
      danger: role !== 'admin',
    })
    if (!ok) return
    setBusy(id)
    try {
      await adminApi.setRole(id, role)
      patchLocal(id, (x) => ({ ...x, role }))
      flash.ok(`Роль ${u.email}: ${role}`)
    } catch (e) {
      flash.fail(e)
    } finally {
      setBusy(null)
    }
  }

  const reset = async (u: AdminUser) => {
    const id = userId(u)
    const lang = resetLang[id] || ''
    const ok = await dialog.ask({
      title: `Скинути прогрес ${lang ? `(${lang.toUpperCase()})` : '(усі мови)'}?`,
      text: `${u.email} — цю дію неможливо скасувати.`,
      confirm: 'Скинути',
      emoji: '♻️',
      danger: true,
    })
    if (!ok) return
    setBusy(id)
    try {
      await adminApi.resetProgress(id, lang || undefined)
      patchLocal(id, (x) => {
        if (!lang) return { ...x, progress: {} }
        const p = { ...(x.progress ?? {}) }
        delete p[lang]
        return { ...x, progress: p }
      })
      flash.ok(`Прогрес ${u.email} скинуто`)
    } catch (e) {
      flash.fail(e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {dialog.node}
      {flash.node}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <div className="relative min-w-0 flex-1 basis-full sm:max-w-xs sm:basis-auto">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">🔍</span>
            <input
              className={`${input} !pl-10`}
              placeholder="Пошук за email або нікнеймом"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {users.data && (
            <span className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300">
              {filtered.length} з {users.data.length}
            </span>
          )}
          <button className={`${btnGhost} ml-auto`} onClick={users.reload}>
            ↻ Оновити
          </button>
        </div>
        {users.loading ? (
          <Spinner rows={5} />
        ) : users.error ? (
          <div className="p-4">
            <Message>{users.error}</Message>
          </div>
        ) : !filtered.length ? (
          <Empty emoji="🔎">Користувачів не знайдено</Empty>
        ) : (
          <ul className="divide-y divide-line/70">
            {filtered.map((u) => {
              const id = userId(u)
              const langs = Object.keys(u.progress ?? {})
              const isAdmin = u.role === 'admin'
              const initial = (u.nickname || u.email || '?').trim().charAt(0).toUpperCase()
              return (
                <li key={id} className="flex flex-col gap-3 p-4 transition hover:bg-surface-2/60 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-extrabold text-white ${
                        isAdmin ? 'bg-brand-gradient' : 'bg-gradient-to-br from-sky-400 to-indigo-500'
                      }`}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-bold text-ink">{u.nickname || '—'}</span>
                        <span
                          className={`chip !py-0.5 ${
                            isAdmin ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-surface-2 text-ink-2'
                          }`}
                        >
                          {isAdmin ? '🛡️ ' : ''}
                          {u.role}
                        </span>
                        {id === me && <span className="chip !py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">ви</span>}
                      </div>
                      <div className="truncate text-sm text-ink-2">{u.email}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ProgressSummary progress={u.progress} />
                        <span className="text-xs text-ink-3">
                          📅 {u.createdAt ? new Date(u.createdAt).toLocaleDateString('uk-UA') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap">
                    <button
                      className={`${btnGhost} flex-1 lg:flex-none`}
                      disabled={busy === id || id === me}
                      title={id === me ? 'Не можна змінити власну роль' : undefined}
                      onClick={() => toggleRole(u)}
                    >
                      {isAdmin ? 'Зробити user' : 'Зробити admin'}
                    </button>
                    <div className="flex flex-1 gap-2 lg:flex-none">
                      <select
                        className="select !w-auto !py-2.5 text-sm"
                        aria-label="Мова для скидання"
                        value={resetLang[id] ?? ''}
                        onChange={(e) => setResetLang((s) => ({ ...s, [id]: e.target.value }))}
                      >
                        <option value="">Усі мови</option>
                        {langs.map((c) => (
                          <option key={c} value={c}>
                            {c.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`${btnGhost} flex-1 !text-rose-600 dark:!text-rose-400 lg:flex-none`}
                        disabled={busy === id}
                        onClick={() => reset(u)}
                      >
                        Скинути
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
