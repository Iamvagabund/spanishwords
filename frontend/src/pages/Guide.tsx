import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import { useStore } from '../store/useStore'
import { fetchResources } from '../services/content'
import { languageTone } from '../theme/palette'
import type { Resource, ResourceType } from '../types'
import {
  CEFR, LANG_GUIDE, LEVELS_INFO, RESOURCE_LEVELS, RESOURCE_TYPES, TIPS, resourceLevelLabel, type CefrLevel,
} from '../data/guide'
import { RichText } from './guide/RichText'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }),
}

function SectionTitle({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink sm:text-2xl">
        <span>{emoji}</span> {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-ink-2">{sub}</p>}
    </div>
  )
}

export default function Guide() {
  const { code, language, blocks } = useLang()
  const tone = languageTone(code)
  const guide = LANG_GUIDE[code]
  const completed = useStore(s => s.progress[code]?.completedBlocks)

  // Estimated level = the level most of the completed blocks belong to (ties → higher), A1 by default.
  const currentLevel: CefrLevel = useMemo(() => {
    const done = new Set((completed ?? []).map(c => c.blockId))
    const counts = new Map<string, number>()
    for (const b of blocks) if (done.has(b.id)) counts.set(b.level, (counts.get(b.level) ?? 0) + 1)
    let best: CefrLevel = 'A1'
    let max = 0
    for (const l of CEFR) {
      const n = counts.get(l) ?? 0
      if (n > 0 && n >= max) {
        best = l
        max = n
      }
    }
    return best
  }, [completed, blocks])

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 pb-28 pt-4 sm:pb-12 sm:pt-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone.gradient} p-6 text-white shadow-lift sm:p-10`}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 animate-float text-[120px] opacity-20 sm:text-[160px]" aria-hidden>
          {language.flag}
        </div>
        <p className="relative text-sm font-bold uppercase tracking-wider text-white/80">
          Гід · {language.flag} {language.nativeName}
        </p>
        <h1 className="relative mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
          Як вивчати {guide?.accusative ?? language.name.toLowerCase()}
        </h1>
        <p className="relative mt-3 max-w-xl text-white/90">
          Шлях від перших слів до вільного володіння: рівні, поради, що працюють, і найкращі матеріали.
        </p>
        <span className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur">
          📍 Ваш орієнтовний рівень: {currentLevel}
        </span>
      </motion.section>

      {/* Level ladder */}
      <section>
        <SectionTitle emoji="🪜" title="Рівні CEFR" sub="Загальноєвропейська шкала. Обсяг слів і годин — приблизні орієнтири." />
        <ol className="space-y-3 sm:space-y-4">
          {LEVELS_INFO.map((info, i) => {
            const here = info.level === currentLevel
            return (
              <motion.li
                key={info.level}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                className={`card relative p-4 sm:p-5 ${here ? `ring-2 ${tone.ring} shadow-glow` : ''}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl font-display font-extrabold ${
                      here ? `bg-gradient-to-br ${tone.gradient} text-white shadow-soft` : 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    <span className="text-lg leading-none">{info.level}</span>
                    <span className="text-sm leading-none">{info.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-ink">{info.name}</h3>
                      {here && <span className={`chip ${tone.soft} ${tone.text}`}>📍 Ви тут</span>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                      <span className="chip bg-surface-2 text-ink-2">📖 {info.vocab}</span>
                      <span className="chip bg-surface-2 text-ink-2">⏱️ {info.hours}</span>
                      <span className="chip bg-surface-2 text-ink-3">приблизно</span>
                    </div>
                    <ul className="mt-3 grid gap-1.5 text-sm text-ink-2 sm:grid-cols-2">
                      {info.canDo.map(c => (
                        <li key={c} className="flex gap-2">
                          <span className="text-emerald-500">✓</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm text-ink-2">
                      <span className="font-bold text-ink">🎯 Фокус:</span> {info.focus}
                    </p>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </section>

      {/* Tips */}
      <section>
        <SectionTitle emoji="💡" title="Як ефективно вчити" sub="Прийоми, підтверджені дослідженнями пам’яті та навчання." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((t, i) => (
            <motion.div
              key={t.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="card p-4"
            >
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${tone.soft}`}>{t.emoji}</div>
              <h3 className="font-extrabold text-ink">{t.title}</h3>
              <p className="mt-1 text-sm text-ink-2">{t.text}</p>
            </motion.div>
          ))}
        </div>
        {guide && (
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-extrabold text-ink">{language.flag} Особливості мови</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {guide.specifics.map(t => (
                <div key={t.title} className={`rounded-3xl border border-line p-4 ${tone.soft}`}>
                  <h4 className="flex items-center gap-2 font-extrabold text-ink">
                    <span className="text-xl">{t.emoji}</span> {t.title}
                  </h4>
                  <p className="mt-2 text-sm text-ink-2">
                    <RichText text={t.text} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Resources code={code} currentLevel={currentLevel} />
    </div>
  )
}

function Resources({ code, currentLevel }: { code: string; currentLevel: CefrLevel }) {
  const [items, setItems] = useState<Resource[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [level, setLevel] = useState<string>('any')
  const [type, setType] = useState<ResourceType | 'any'>('any')
  const tone = languageTone(code)

  useEffect(() => {
    let alive = true
    setItems(null)
    setError(false)
    fetchResources(code)
      .then(r => alive && setItems(r))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [code, attempt])

  const filtered = useMemo(
    () =>
      (items ?? []).filter(
        r => (level === 'any' || r.level === level || r.level === 'all') && (type === 'any' || r.type === type),
      ),
    [items, level, type],
  )
  const groups = useMemo(
    () =>
      RESOURCE_LEVELS.map(l => ({
        level: l,
        list: filtered.filter(r => r.level === l).sort((a, b) => a.order - b.order),
      })).filter(g => g.list.length),
    [filtered],
  )
  const presentTypes = useMemo(
    () => (Object.keys(RESOURCE_TYPES) as ResourceType[]).filter(t => items?.some(r => r.type === t)),
    [items],
  )

  const chipCls = (active: boolean) =>
    `chip min-h-[36px] cursor-pointer whitespace-nowrap px-3 transition active:scale-95 ${
      active ? 'bg-brand-gradient text-white shadow-glow' : 'bg-surface-2 text-ink-2 hover:text-ink'
    }`

  return (
    <section>
      <SectionTitle emoji="🎒" title="Корисні матеріали" sub="Книги, подкасти, канали та застосунки під ваш рівень." />
      <div className="mb-2 flex flex-wrap gap-2">
        <button className={chipCls(level === 'any')} onClick={() => setLevel('any')}>
          Усі рівні
        </button>
        {CEFR.map(l => (
          <button key={l} className={chipCls(level === l)} onClick={() => setLevel(l)}>
            {l}
            {l === currentLevel ? ' 📍' : ''}
          </button>
        ))}
      </div>
      {presentTypes.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button className={chipCls(type === 'any')} onClick={() => setType('any')}>
            Усі типи
          </button>
          {presentTypes.map(t => (
            <button key={t} className={chipCls(type === t)} onClick={() => setType(t)}>
              {RESOURCE_TYPES[t].emoji} {RESOURCE_TYPES[t].label}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-3xl">😕</div>
          <p className="text-ink-2">Не вдалося завантажити матеріали.</p>
          <button className="btn btn-primary" onClick={() => setAttempt(a => a + 1)}>
            Спробувати ще
          </button>
        </div>
      ) : items === null ? (
        <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Завантаження">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-surface-2" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${tone.gradient} text-3xl shadow-glow`}>
            📭
          </div>
          <p className="text-ink-2">{items.length ? 'Нічого не знайдено за цими фільтрами.' : 'Матеріали скоро з’являться.'}</p>
          {items.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setLevel('any')
                setType('any')
              }}
            >
              Скинути фільтри
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.level}>
              <h3 className="mb-3 flex items-center gap-2 font-extrabold text-ink">
                <span className={`chip ${tone.soft} ${tone.text}`}>{resourceLevelLabel(g.level)}</span>
                <span className="text-sm font-semibold text-ink-3">{g.list.length}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.list.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="card card-interactive flex gap-3 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
                      {RESOURCE_TYPES[r.type]?.emoji ?? '🔗'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="break-words font-extrabold text-ink">{r.title}</span>
                        <span className="shrink-0 text-ink-3" aria-hidden>
                          ↗
                        </span>
                      </span>
                      {r.author && <span className="block text-xs font-semibold text-ink-3">{r.author}</span>}
                      <span className="mt-1 block text-sm text-ink-2">{r.description}</span>
                      <span className="mt-2 inline-block text-xs font-bold text-ink-3">{RESOURCE_TYPES[r.type]?.label}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
