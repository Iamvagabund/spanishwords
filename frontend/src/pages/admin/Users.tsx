import { useMemo, useState } from 'react'
import { adminApi, type AdminUser, type LangProgressSummary, userId } from '../../services/adminApi'
import { useAuthStore } from '../../store/authStore'
import { btnGhost, card, Empty, input, Message, Spinner, useFlash, useLoad } from './ui'

const count = (v: unknown) => (Array.isArray(v) ? v.length : typeof v === 'number' ? v : 0)

function ProgressSummary({ progress }: { progress?: Record<string, LangProgressSummary> }) {
  const entries = Object.entries(progress ?? {})
  if (!entries.length) return <span className="text-zinc-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([code, p]) => (
        <span
          key={code}
          className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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
    if (!confirm(`${role === 'admin' ? 'Надати' : 'Забрати'} права адміністратора для ${u.email}?`)) return
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
    if (!confirm(`Скинути прогрес ${lang ? `(${lang.toUpperCase()})` : '(усі мови)'} для ${u.email}?`)) return
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
      {flash.node}
      <div className={`${card} !p-0 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <input
            className={`${input} sm:max-w-xs`}
            placeholder="Пошук за email або нікнеймом"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-sm text-zinc-500">
            {users.data ? `${filtered.length} з ${users.data.length}` : ''}
          </span>
          <button className={`${btnGhost} sm:ml-auto`} onClick={users.reload}>
            Оновити
          </button>
        </div>
        {users.loading ? (
          <Spinner />
        ) : users.error ? (
          <div className="p-4">
            <Message>{users.error}</Message>
          </div>
        ) : !filtered.length ? (
          <Empty>Користувачів не знайдено</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Нікнейм</th>
                  <th className="px-4 py-3">Роль</th>
                  <th className="px-4 py-3">Прогрес</th>
                  <th className="px-4 py-3">Створено</th>
                  <th className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800 dark:divide-zinc-800 dark:text-zinc-200">
                {filtered.map((u) => {
                  const id = userId(u)
                  const langs = Object.keys(u.progress ?? {})
                  return (
                    <tr key={id}>
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3">{u.nickname || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ProgressSummary progress={u.progress} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('uk-UA') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className={btnGhost}
                            disabled={busy === id || id === me}
                            title={id === me ? 'Не можна змінити власну роль' : undefined}
                            onClick={() => toggleRole(u)}
                          >
                            {u.role === 'admin' ? 'Зробити user' : 'Зробити admin'}
                          </button>
                          <select
                            className={`${input} !w-auto`}
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
                            className={`${btnGhost} !text-red-600 dark:!text-red-400`}
                            disabled={busy === id}
                            onClick={() => reset(u)}
                          >
                            Скинути
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
