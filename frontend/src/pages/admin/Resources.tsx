import { useEffect, useState } from 'react'
import { adminApi, type AdminResource, type ResourceInput } from '../../services/adminApi'
import type { ResourceType } from '../../types'
import { languageTone } from '../../theme/palette'
import { RESOURCE_LEVELS, RESOURCE_TYPES, resourceLevelLabel } from '../../data/guide'
import {
  btnGhost, btnPrimary, card, chip, Dialog, Empty, errMsg, iconBtn, input, label, Message, Spinner, useConfirm, useFlash, useLoad,
} from './ui'

type Level = AdminResource['level']
const TYPES = Object.keys(RESOURCE_TYPES) as ResourceType[]

export const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AdminResources() {
  const langs = useLoad(() => adminApi.getLanguages(), [])
  const [lang, setLang] = useState('')
  useEffect(() => {
    if (!lang && langs.data?.length) setLang(langs.data[0].code)
  }, [lang, langs.data])

  const list = useLoad(() => (lang ? adminApi.getResources(lang) : Promise.resolve([] as AdminResource[])), [lang])
  const [editing, setEditing] = useState<AdminResource | 'new' | null>(null)
  const confirm = useConfirm()
  const flash = useFlash()

  const remove = async (r: AdminResource) => {
    const ok = await confirm.ask({ title: 'Видалити матеріал?', text: `«${r.title}» буде видалено назавжди.`, confirm: 'Видалити', danger: true })
    if (!ok) return
    try {
      await adminApi.deleteResource(r.id)
      list.setData((d) => d?.filter((x) => x.id !== r.id) ?? null)
      flash.ok('Матеріал видалено')
    } catch (e) {
      flash.fail(e)
    }
  }

  const groups = RESOURCE_LEVELS.map((l) => ({
    level: l,
    items: (list.data ?? []).filter((r) => r.level === l).sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length)

  return (
    <div className="space-y-4">
      {confirm.node}
      {flash.node}
      <div className={`${card} flex flex-wrap items-center gap-2`}>
        {(langs.data ?? []).map((l) => {
          const tone = languageTone(l.code)
          const on = l.code === lang
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex min-h-[44px] items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition active:scale-95 ${
                on ? `border-transparent bg-gradient-to-br ${tone.gradient} text-white shadow-soft` : 'border-line text-ink-2 hover:bg-surface-2'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              {l.name}
            </button>
          )
        })}
        <button className={`${btnPrimary} sm:ml-auto`} onClick={() => setEditing('new')} disabled={!lang}>
          + Матеріал
        </button>
      </div>
      {langs.error && <Message>{langs.error}</Message>}

      <div className={card}>
        {list.loading ? (
          <Spinner />
        ) : list.error ? (
          <Message>
            {list.error}{' '}
            <button className="underline" onClick={list.reload}>
              Повторити
            </button>
          </Message>
        ) : !groups.length ? (
          <Empty emoji="🎒">
            <p>Для цієї мови ще немає матеріалів.</p>
            <button className={btnPrimary} onClick={() => setEditing('new')}>
              + Додати перший
            </button>
          </Empty>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.level}>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-ink">
                  {resourceLevelLabel(g.level)} <span className={chip}>{g.items.length}</span>
                </h3>
                <ul className="divide-y divide-line/70 rounded-2xl border border-line/70">
                  {g.items.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl">
                        {RESOURCE_TYPES[r.type]?.emoji ?? '🔗'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-ink">{r.title}</p>
                        <p className="truncate text-xs text-ink-3">
                          {r.author ? `${r.author} · ` : ''}
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {r.url}
                          </a>
                        </p>
                      </div>
                      <button className={iconBtn} title="Редагувати" aria-label="Редагувати" onClick={() => setEditing(r)}>
                        ✏️
                      </button>
                      <button className={`${iconBtn} hover:!text-rose-500`} title="Видалити" aria-label="Видалити" onClick={() => remove(r)}>
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <ResourceForm
            key={editing === 'new' ? 'new' : editing.id}
            language={lang}
            resource={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              flash.ok('Збережено')
              list.reload()
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

function ResourceForm({
  language,
  resource,
  onSaved,
  onCancel,
}: {
  language: string
  resource: AdminResource | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [f, setF] = useState({
    level: (resource?.level ?? 'A1') as Level,
    type: (resource?.type ?? 'book') as ResourceType,
    title: resource?.title ?? '',
    author: resource?.author ?? '',
    description: resource?.description ?? '',
    url: resource?.url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const urlBad = f.url.trim() !== '' && !isHttpUrl(f.url.trim())

  const save = async () => {
    setError(null)
    if (!f.title.trim()) return setError('Вкажіть назву')
    if (!f.description.trim()) return setError('Додайте опис')
    if (!isHttpUrl(f.url.trim())) return setError('Посилання має починатися з http:// або https://')
    const body: ResourceInput = {
      language,
      level: f.level,
      type: f.type,
      title: f.title.trim(),
      description: f.description.trim(),
      url: f.url.trim(),
      ...(f.author.trim() ? { author: f.author.trim() } : {}),
    }
    setSaving(true)
    try {
      if (resource) await adminApi.updateResource(resource.id, { ...body, author: f.author.trim() })
      else await adminApi.createResource(body)
      onSaved()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-ink">{resource ? 'Редагувати матеріал' : 'Новий матеріал'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Рівень</label>
          <select className="select !py-2.5 text-sm" value={f.level} onChange={(e) => set('level', e.target.value as Level)}>
            {RESOURCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {resourceLevelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Тип</label>
          <select className="select !py-2.5 text-sm" value={f.type} onChange={(e) => set('type', e.target.value as ResourceType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPES[t].emoji} {RESOURCE_TYPES[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Назва</label>
        <input className={input} value={f.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div>
        <label className={label}>Автор (опц.)</label>
        <input className={input} value={f.author} onChange={(e) => set('author', e.target.value)} />
      </div>
      <div>
        <label className={label}>Опис</label>
        <textarea className={`${input} h-24`} value={f.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label className={label}>Посилання</label>
        <input
          className={`${input} ${urlBad ? '!border-rose-500' : ''}`}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={f.url}
          onChange={(e) => set('url', e.target.value)}
        />
        {urlBad && <p className="mt-1 text-xs font-semibold text-rose-500">Некоректне посилання (потрібно http/https)</p>}
      </div>
      {error && <Message onClose={() => setError(null)}>{error}</Message>}
      <div className="flex gap-2">
        <button className={`${btnGhost} flex-1`} onClick={onCancel}>
          Скасувати
        </button>
        <button className={`${btnPrimary} flex-[2]`} onClick={save} disabled={saving}>
          {saving ? 'Збереження…' : '💾 Зберегти'}
        </button>
      </div>
    </div>
  )
}
