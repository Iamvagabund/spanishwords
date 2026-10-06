import { useState } from 'react'
import { adminApi, type AdminBlock, type BlockInput, type Level, LEVELS, type WordInput } from '../../services/adminApi'
import { blockEmoji, blockTone } from '../../theme/palette'
import { btnGhost, btnPrimary, card, chip, errMsg, iconBtn, input, label, Message } from './ui'

type Row = WordInput & { key: string }
let seq = 0
const newRow = (w: Partial<WordInput> = {}): Row => ({
  key: `r${++seq}`,
  term: '',
  translation: '',
  example: '',
  exampleTranslation: '',
  ...w,
})

/** Parse "term — translation" lines (separators: — – - | tab = ;). */
export function parseQuickPaste(text: string): WordInput[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(/\s*(?:—|–|\t|\||=|;|\s-\s)\s*/)
      return { term: (m[0] ?? '').trim(), translation: m.slice(1).join(' ').trim() }
    })
    .filter((w) => w.term)
}

export default function BlockEditor({
  language,
  block,
  onSaved,
  onCancel,
}: {
  language: string
  block: AdminBlock | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(block?.title ?? '')
  const [titleTarget, setTitleTarget] = useState(block?.titleTarget ?? '')
  const [description, setDescription] = useState(block?.description ?? '')
  const [level, setLevel] = useState<Level>(block?.level ?? 'A1')
  const [order, setOrder] = useState<string>(block ? String(block.order) : '')
  const [rows, setRows] = useState<Row[]>(() => (block?.words.length ? block.words.map((w) => newRow(w)) : [newRow()]))
  const [paste, setPaste] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, field: keyof WordInput, v: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: v } : r)))

  const applyPaste = () => {
    const parsed = parseQuickPaste(paste)
    if (!parsed.length) return
    setRows((rs) => [...rs.filter((r) => r.term.trim() || r.translation.trim()), ...parsed.map((w) => newRow(w))])
    setPaste('')
    setShowPaste(false)
  }

  const save = async () => {
    setError(null)
    const words = rows
      .filter((r) => r.term.trim() || r.translation.trim())
      .map(({ key: _k, ...w }) => ({
        ...(w.id ? { id: w.id } : {}),
        term: w.term.trim(),
        translation: w.translation.trim(),
        ...(w.example?.trim() ? { example: w.example.trim() } : {}),
        ...(w.exampleTranslation?.trim() ? { exampleTranslation: w.exampleTranslation.trim() } : {}),
      }))
    if (!title.trim() || !titleTarget.trim()) return setError('Заповніть назву та назву мовою оригіналу')
    if (!words.length) return setError('Додайте хоча б одне слово')
    const bad = words.findIndex((w) => !w.term || !w.translation)
    if (bad >= 0) return setError(`Рядок ${bad + 1}: потрібні слово і переклад`)
    const body: BlockInput = {
      language,
      title: title.trim(),
      titleTarget: titleTarget.trim(),
      description: description.trim(),
      level,
      words,
      ...(order.trim() ? { order: Number(order) } : {}),
    }
    setSaving(true)
    try {
      if (block) await adminApi.updateBlock(block.id, body)
      else await adminApi.createBlock(body)
      onSaved()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  const tone = blockTone(block?.order ?? (Number(order) || 1))
  const fieldsMeta = [
    ['term', 'Слово'],
    ['translation', 'Переклад'],
    ['example', 'Приклад'],
    ['exampleTranslation', 'Переклад прикладу'],
  ] as const

  return (
    <div className="space-y-4 pb-24 sm:pb-0">
      <div className={`${card} space-y-5`}>
        <div className="flex items-center gap-3">
          <button className={iconBtn} onClick={onCancel} aria-label="Назад" title="Назад">
            ←
          </button>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.gradient} text-2xl shadow-soft`}
          >
            {blockEmoji(title)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-ink">{title.trim() || (block ? 'Блок' : 'Новий блок')}</h2>
            <p className="text-xs font-semibold text-ink-3">
              {block ? `Редагування блоку #${block.order}` : 'Створення блоку'} · {language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className={label}>Назва (укр.)</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Назва мовою вивчення</label>
            <input className={input} value={titleTarget} onChange={(e) => setTitleTarget(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Опис</label>
            <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <div>
              <label className={label}>Рівень</label>
              <select className={`select !py-2.5 text-sm`} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Порядок {block ? '' : '(опц.)'}</label>
              <input
                className={input}
                type="number"
                min={1}
                value={order}
                placeholder="в кінець"
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto flex items-center gap-2 text-lg font-bold text-ink">
            Слова <span className={chip}>{rows.length}</span>
          </h3>
          <button className={btnGhost} onClick={() => setShowPaste((v) => !v)}>
            ⚡ Вставка
          </button>
          <button className={btnGhost} onClick={() => setRows((rs) => [...rs, newRow()])}>
            + Рядок
          </button>
        </div>
        {showPaste && (
          <div className="animate-pop-in space-y-3 rounded-2xl border border-line/70 bg-surface-2 p-3">
            <textarea
              className={`${input} h-32 font-mono`}
              placeholder={'hola — привіт\nadiós — до побачення'}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button className={btnPrimary} onClick={applyPaste} disabled={!paste.trim()}>
                Додати {parseQuickPaste(paste).length || ''} рядків
              </button>
              <span className="text-xs text-ink-3">Формат: «слово — переклад», по одному на рядок</span>
            </div>
          </div>
        )}

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs font-bold uppercase tracking-wide text-ink-3">
              <tr>
                <th className="w-8 py-2">#</th>
                {fieldsMeta.map(([f, l]) => (
                  <th key={f} className="px-1 py-2">
                    {l}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="py-1 font-bold text-ink-3">{i + 1}</td>
                  {fieldsMeta.map(([f]) => (
                    <td key={f} className="px-1 py-1">
                      <input className={input} value={r[f] ?? ''} onChange={(e) => update(r.key, f, e.target.value)} />
                    </td>
                  ))}
                  <td>
                    <button
                      className={`${iconBtn} hover:!text-rose-500`}
                      title="Видалити рядок"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked cards */}
        <div className="space-y-3 md:hidden">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-2xl border border-line/70 bg-surface-2/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={`chip ${tone.soft} ${tone.text}`}>#{i + 1}</span>
                <button
                  className={`${iconBtn} !h-9 !w-9 hover:!text-rose-500`}
                  aria-label="Видалити рядок"
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fieldsMeta.map(([f, l]) => (
                  <div key={f} className="min-w-0">
                    <label className={`${label} !mb-1 !text-[10px]`}>{l}</label>
                    <input className={input} value={r[f] ?? ''} onChange={(e) => update(r.key, f, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className={`${btnGhost} w-full`} onClick={() => setRows((rs) => [...rs, newRow()])}>
            + Додати слово
          </button>
        </div>
      </div>

      {error && <Message onClose={() => setError(null)}>{error}</Message>}

      <div className="glass pb-safe fixed inset-x-0 bottom-0 z-40 flex gap-2 rounded-t-3xl px-4 pt-3 shadow-lift sm:static sm:justify-end sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <div className="flex w-full gap-2 pb-3 sm:w-auto sm:pb-0">
          <button className={`${btnGhost} flex-1 sm:flex-none`} onClick={onCancel}>
            Скасувати
          </button>
          <button className={`${btnPrimary} flex-[2] sm:flex-none`} onClick={save} disabled={saving}>
            {saving ? 'Збереження…' : '💾 Зберегти'}
          </button>
        </div>
      </div>
    </div>
  )
}
