import { type FormEvent, useEffect, useState } from 'react'
import { adminApi, type AdminBlock } from '../../services/adminApi'
import BlockEditor from './BlockEditor'
import ImportPanel from './ImportPanel'
import { btnGhost, btnPrimary, card, Empty, iconBtn, input, Message, Spinner, useFlash, useLoad } from './ui'

type Mode = { kind: 'list' } | { kind: 'edit'; block: AdminBlock | null } | { kind: 'import' }

function AddLanguageForm({ onAdded, onCancel }: { onAdded: (code: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({ code: '', name: '', nativeName: '', flag: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const code = f.code.trim().toLowerCase()
    if (!/^[a-z]{2,3}$/.test(code)) return setError('Код — 2–3 латинські літери (напр. de)')
    if (!f.name.trim() || !f.nativeName.trim()) return setError('Заповніть назву та самоназву')
    setBusy(true)
    setError(null)
    try {
      await adminApi.createLanguage({ code, name: f.name.trim(), nativeName: f.nativeName.trim(), flag: f.flag.trim() })
      onAdded(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setBusy(false)
    }
  }
  const fields: [keyof typeof f, string, string][] = [
    ['code', 'Код', 'de'],
    ['name', 'Назва (укр.)', 'Німецька'],
    ['nativeName', 'Самоназва', 'Deutsch'],
    ['flag', 'Прапор', '🇩🇪'],
  ]
  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="grid gap-3 sm:grid-cols-4">
        {fields.map(([k, l, ph]) => (
          <div key={k}>
            <label className="mb-1 block text-xs text-zinc-500">{l}</label>
            <input className={input} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      {error && <Message>{error}</Message>}
      <div className="flex gap-2">
        <button className={btnPrimary} disabled={busy}>
          {busy ? 'Додавання…' : 'Додати'}
        </button>
        <button type="button" className={btnGhost} onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  )
}

export default function AdminContent() {
  const langs = useLoad(() => adminApi.getLanguages(), [])
  const [lang, setLang] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [busy, setBusy] = useState(false)
  const flash = useFlash()

  useEffect(() => {
    if (!lang && langs.data?.length) setLang(langs.data[0].code)
  }, [langs.data, lang])

  const blocks = useLoad(() => (lang ? adminApi.getBlocks(lang) : Promise.resolve([] as AdminBlock[])), [lang])
  const current = langs.data?.find((l) => l.code === lang)

  const toggleActive = async () => {
    if (!current) return
    setBusy(true)
    try {
      await adminApi.updateLanguage(current.code, { isActive: !current.isActive })
      langs.setData((ls) => ls?.map((l) => (l.code === current.code ? { ...l, isActive: !l.isActive } : l)) ?? null)
      flash.ok(`${current.name}: ${current.isActive ? 'вимкнено' : 'увімкнено'}`)
    } catch (e) {
      flash.fail(e)
    } finally {
      setBusy(false)
    }
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const list = [...(blocks.data ?? [])]
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    ;[list[idx], list[j]] = [list[j], list[idx]]
    const prev = blocks.data
    blocks.setData(list.map((b, i) => ({ ...b, order: i + 1 })))
    setBusy(true)
    try {
      await adminApi.reorderBlocks(lang, list.map((b) => b.id))
    } catch (e) {
      blocks.setData(prev)
      flash.fail(e)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (b: AdminBlock) => {
    if (!confirm(`Видалити блок #${b.order} «${b.title}» (${b.words.length} слів)? Це незворотно.`)) return
    setBusy(true)
    try {
      await adminApi.deleteBlock(b.id)
      flash.ok(`Блок «${b.title}» видалено`)
      await blocks.reload()
    } catch (e) {
      flash.fail(e)
    } finally {
      setBusy(false)
    }
  }

  if (langs.loading) return <Spinner />
  if (langs.error) return <Message>{langs.error}</Message>

  if (mode.kind === 'edit' && lang)
    return (
      <BlockEditor
        key={mode.block?.id ?? 'new'}
        language={lang}
        block={mode.block}
        onCancel={() => setMode({ kind: 'list' })}
        onSaved={() => {
          flash.ok('Блок збережено')
          setMode({ kind: 'list' })
          blocks.reload()
        }}
      />
    )
  if (mode.kind === 'import' && lang)
    return (
      <ImportPanel
        language={lang}
        onCancel={() => setMode({ kind: 'list' })}
        onDone={(n) => {
          flash.ok(`Імпортовано блоків: ${n}`)
          setMode({ kind: 'list' })
          blocks.reload()
        }}
      />
    )

  return (
    <div className="space-y-4">
      {flash.node}
      <div className={card}>
        <div className="flex flex-wrap items-center gap-2">
          {(langs.data ?? []).map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                l.code === lang
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              } ${l.isActive ? '' : 'opacity-60'}`}
            >
              <span className="text-lg">{l.flag}</span>
              {l.name}
              <span className="text-xs uppercase text-zinc-400">{l.code}</span>
            </button>
          ))}
          <button className={`${btnGhost} sm:ml-auto`} onClick={() => setAdding((v) => !v)}>
            + Додати мову
          </button>
        </div>
        {adding && (
          <AddLanguageForm
            onCancel={() => setAdding(false)}
            onAdded={async (code) => {
              setAdding(false)
              await langs.reload()
              setLang(code)
              flash.ok('Мову додано')
            }}
          />
        )}
        {current && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-400">
              {current.nativeName} · {current.isActive ? 'активна' : 'неактивна (прихована від учнів)'}
            </span>
            <button
              role="switch"
              aria-checked={current.isActive}
              disabled={busy}
              onClick={toggleActive}
              className={`relative h-6 w-11 rounded-full transition ${current.isActive ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${current.isActive ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
        )}
      </div>

      {!langs.data?.length ? (
        <Empty>Мов ще немає — додайте першу.</Empty>
      ) : (
        <div className={`${card} !p-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Блоки {blocks.data ? `(${blocks.data.length})` : ''}
            </h2>
            <button className={`${btnGhost} ml-auto`} onClick={() => setMode({ kind: 'import' })}>
              Імпорт JSON
            </button>
            <button className={btnPrimary} onClick={() => setMode({ kind: 'edit', block: null })}>
              + Новий блок
            </button>
          </div>
          {blocks.loading ? (
            <Spinner />
          ) : blocks.error ? (
            <div className="p-4">
              <Message>{blocks.error}</Message>
            </div>
          ) : !blocks.data?.length ? (
            <Empty>Блоків для цієї мови ще немає</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Назва</th>
                    <th className="px-4 py-3">Рівень</th>
                    <th className="px-4 py-3">Слів</th>
                    <th className="px-4 py-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800 dark:divide-zinc-800 dark:text-zinc-200">
                  {blocks.data.map((b, i, arr) => (
                    <tr key={b.id}>
                      <td className="px-4 py-2 text-zinc-500">{b.order}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{b.title}</div>
                        <div className="text-xs text-zinc-500">{b.titleTarget}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{b.level}</span>
                      </td>
                      <td className="px-4 py-2">{b.words.length}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <button className={iconBtn} title="Вгору" disabled={busy || i === 0} onClick={() => move(i, -1)}>
                            ↑
                          </button>
                          <button
                            className={iconBtn}
                            title="Вниз"
                            disabled={busy || i === arr.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            ↓
                          </button>
                          <button className={iconBtn} title="Редагувати" onClick={() => setMode({ kind: 'edit', block: b })}>
                            ✎
                          </button>
                          <button
                            className={`${iconBtn} hover:!text-red-600`}
                            title="Видалити"
                            disabled={busy}
                            onClick={() => remove(b)}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
