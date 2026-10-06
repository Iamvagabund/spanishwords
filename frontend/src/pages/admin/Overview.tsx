import { adminApi } from '../../services/adminApi'
import { languageTone } from '../../theme/palette'
import { btnGhost, Empty, Message, Skeleton, useLoad } from './ui'

function Tile({ label, value, emoji }: { label: string; value: string | number; emoji: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
      <div className="text-xs font-semibold text-white/80">
        {emoji} {label}
      </div>
      <div className="mt-1 font-display text-2xl font-extrabold text-white">{value}</div>
    </div>
  )
}

export default function AdminOverview() {
  const stats = useLoad(() => adminApi.getStatistics(), [])
  const langs = useLoad(() => adminApi.getLanguages(), [])

  if (stats.loading)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 !rounded-3xl" />
          <Skeleton className="h-28 !rounded-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 !rounded-3xl" />
          <Skeleton className="h-56 !rounded-3xl" />
        </div>
      </div>
    )
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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15">👥</span>
            <span className="truncate">Користувачів</span>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">{s.totalUsers}</div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/15">🛡️</span>
            <span className="truncate">Адмінів</span>
          </div>
          <div className="text-gradient mt-3 font-display text-3xl font-extrabold sm:text-4xl">{s.totalAdmins}</div>
        </div>
      </div>
      {s.perLanguage.length === 0 ? (
        <Empty emoji="🌐">Мов ще немає</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.perLanguage.map((p) => {
            const l = langOf(p.code)
            const tone = languageTone(p.code)
            return (
              <div
                key={p.code}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone.gradient} p-5 shadow-lift sm:p-6`}
              >
                <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[7rem] opacity-20">
                  {l?.flag ?? '🌐'}
                </div>
                <h2 className="relative mb-4 flex flex-wrap items-center gap-2 text-xl font-bold text-white">
                  <span className="text-3xl">{l?.flag ?? '🌐'}</span>
                  {l?.name ?? p.code.toUpperCase()}
                  {l && !l.isActive && <span className="chip bg-black/25 text-white">неактивна</span>}
                </h2>
                <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Tile emoji="🎓" label="Учнів" value={p.learners} />
                  <Tile emoji="📦" label="Блоків" value={p.blocks} />
                  <Tile emoji="🔤" label="Слів" value={p.words} />
                  <Tile emoji="⭐" label="Сер. бал" value={Number(p.avgScore || 0).toFixed(1)} />
                  <Tile emoji="🏁" label="Пройдено" value={p.completedBlocks} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
