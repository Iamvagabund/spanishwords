import { type FormEvent, useEffect, useState } from 'react'
import { adminApi, type AdminBlock } from '../../services/adminApi'
import { blockEmoji, blockTone, languageTone } from '../../theme/palette'
import BlockEditor from './BlockEditor'
import ImportPanel from './ImportPanel'
import {
  btnGhost,
  btnPrimary,
  card,
  chip,
  Empty,
  iconBtn,
  input,
  label,
  Message,
  Spinner,
  useConfirm,
  useFlash,
  useLoad,
} from './ui'

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
    <form onSubmit={submit} className="mt-4 animate-pop-in space-y-3 rounded-2xl border border-line/70 bg-surface-2 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(([k, l, ph]) => (
          <div key={k} className="min-w-0">
            <label className={label}>{l}</label>
            <input className={input} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      {error && <Message>{error}</Message>}
      <div className="flex flex-wrap gap-2">
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
  const dialog = useConfirm()

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
    const ok = await dialog.ask({
      title: `Видалити блок «${b.title}»?`,
      text: `Блок #${b.order} з ${b.words.length} слів буде видалено назавжди.`,
      confirm: 'Видалити',
      danger: true,
    })
    if (!ok) return
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

  if (langs.loading)
    return (
      <div className="card">
        <Spinner />
      </div>
    )
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
      {dialog.node}
      {flash.node}
      <div className={card}>
        <div className="flex flex-wrap items-center gap-2">
          {(langs.data ?? []).map((l) => {
            const tone = languageTone(l.code)
            const on = l.code === lang
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex min-h-[44px] items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition active:scale-95 ${
                  on
                    ? `border-transparent bg-gradient-to-br ${tone.gradient} text-white shadow-soft`
                    : 'border-line text-ink-2 hover:bg-surface-2'
                } ${l.isActive ? '' : 'opacity-60'}`}
              >
                <span className="text-lg">{l.flag}</span>
                {l.name}
                <span className={`text-xs uppercase ${on ? 'text-white/75' : 'text-ink-3'}`}>{l.code}</span>
              </button>
            )
          })}
          <button className={`${btnGhost} sm:ml-auto`} onClick={() => setAdding((v) => !v)}>
            {adding ? '✕ Закрити' : '+ Додати мову'}
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
          <div className="mt-4 flex items-center gap-3 border-t border-line/70 pt-4 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink">{current.nativeName}</div>
              <div className="text-ink-3">
                {current.isActive ? 'Активна — видима учням' : 'Неактивна — прихована від учнів'}
              </div>
            </div>
            <button
              role="switch"
              aria-checked={current.isActive}
              aria-label="Активна"
              disabled={busy}
              onClick={toggleActive}
              className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
                current.isActive ? 'bg-emerald-500' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  current.isActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {!langs.data?.length ? (
        <div className={card}>
          <Empty emoji="🌐">Мов ще немає — додайте першу.</Empty>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 p-4">
            <h2 className="mr-auto flex items-center gap-2 text-lg font-bold text-ink">
              Блоки {blocks.data && <span className={chip}>{blocks.data.length}</span>}
            </h2>
            <button className={btnGhost} onClick={() => setMode({ kind: 'import' })}>
              📥 <span className="hidden min-[400px]:inline">Імпорт</span> JSON
            </button>
            <button className={btnPrimary} onClick={() => setMode({ kind: 'edit', block: null })}>
              + Новий
            </button>
          </div>
          {blocks.loading ? (
            <Spinner />
          ) : blocks.error ? (
            <div className="p-4">
              <Message>{blocks.error}</Message>
            </div>
          ) : !blocks.data?.length ? (
            <Empty emoji="📦">Блоків для цієї мови ще немає</Empty>
          ) : (
            <ul className="divide-y divide-line/70">
              {blocks.data.map((b, i, arr) => {
                const tone = blockTone(b.order)
                return (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center gap-2 px-3 py-3 transition hover:bg-surface-2/60 sm:flex-nowrap sm:px-4"
                  >
                    <button
                      onClick={() => setMode({ kind: 'edit', block: b })}
                      className="flex min-w-0 flex-1 basis-full items-center gap-3 text-left sm:basis-auto"
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.gradient} text-2xl shadow-soft`}
                      >
                        {blockEmoji(b.title)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink-3">#{b.order}</span>
                          <span className="truncate font-bold text-ink">{b.title}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="max-w-full truncate text-xs text-ink-2">{b.titleTarget}</span>
                          <span className={`chip ${tone.soft} ${tone.text} !py-0.5`}>{b.level}</span>
                          <span className={`${chip} !py-0.5`}>{b.words.length} слів</span>
                        </span>
                      </span>
                    </button>
                    <div className="ml-auto flex shrink-0 gap-0.5">
                      <button
                        className={iconBtn}
                        title="Вгору"
                        aria-label="Вгору"
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className={iconBtn}
                        title="Вниз"
                        aria-label="Вниз"
                        disabled={busy || i === arr.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        ↓
                      </button>
                      <button
                        className={iconBtn}
                        title="Редагувати"
                        aria-label="Редагувати"
                        onClick={() => setMode({ kind: 'edit', block: b })}
                      >
                        ✎
                      </button>
                      <button
                        className={`${iconBtn} hover:!bg-rose-500/10 hover:!text-rose-500`}
                        title="Видалити"
                        aria-label="Видалити"
                        disabled={busy}
                        onClick={() => remove(b)}
                      >
                        🗑
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
