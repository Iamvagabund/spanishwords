import { adminApi } from '../../services/adminApi'
import { card, Empty, Message, Spinner, useLoad, btnGhost } from './ui'

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  )
}

export default function AdminOverview() {
  const stats = useLoad(() => adminApi.getStatistics(), [])
  const langs = useLoad(() => adminApi.getLanguages(), [])

  if (stats.loading) return <Spinner />
  if (stats.error)
    return (
      <div className="space-y-3">
        <Message>{stats.error}</Message>
        <button className={btnGhost} onClick={stats.reload}>
          Спробувати ще
        </button>
      </div>
    )
  const s = stats.data
  if (!s) return <Empty>Немає даних</Empty>
  const langOf = (code: string) => langs.data?.find((l) => l.code === code)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <div className="text-sm text-zinc-500">Усього користувачів</div>
          <div className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{s.totalUsers}</div>
        </div>
        <div className={card}>
          <div className="text-sm text-zinc-500">Адміністраторів</div>
          <div className="mt-1 text-3xl font-bold text-indigo-600 dark:text-indigo-400">{s.totalAdmins}</div>
        </div>
      </div>
      {s.perLanguage.length === 0 ? (
        <Empty>Мов ще немає</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.perLanguage.map((p) => {
            const l = langOf(p.code)
            return (
              <div key={p.code} className={card}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  <span className="text-2xl">{l?.flag ?? '🌐'}</span>
                  {l?.name ?? p.code.toUpperCase()}
                  {l && !l.isActive && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      неактивна
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Tile label="Учнів" value={p.learners} />
                  <Tile label="Блоків" value={p.blocks} />
                  <Tile label="Слів" value={p.words} />
                  <Tile label="Середній бал" value={Number(p.avgScore || 0).toFixed(1)} />
                  <Tile label="Пройдено блоків" value={p.completedBlocks} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
