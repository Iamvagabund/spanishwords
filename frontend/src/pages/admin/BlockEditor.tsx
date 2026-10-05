import { useState } from 'react'
import { adminApi, type AdminBlock, type BlockInput, type Level, LEVELS, type WordInput } from '../../services/adminApi'
import { btnGhost, btnPrimary, card, errMsg, iconBtn, input, Message } from './ui'

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

  const label = 'mb-1 block text-xs font-medium text-zinc-500'

  return (
    <div className={`${card} space-y-5`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {block ? `Редагування блоку #${block.order}` : 'Новий блок'}
        </h2>
        <button className={btnGhost} onClick={onCancel}>
          ← Назад
        </button>
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
        <div>
          <label className={label}>Рівень</label>
          <select className={input} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Порядок {block ? '' : '(необов’язково)'}</label>
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

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Слова ({rows.length})</h3>
          <button className={`${btnGhost} ml-auto`} onClick={() => setShowPaste((v) => !v)}>
            Швидка вставка
          </button>
          <button className={btnGhost} onClick={() => setRows((rs) => [...rs, newRow()])}>
            + Рядок
          </button>
        </div>
        {showPaste && (
          <div className="mb-3 space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
            <textarea
              className={`${input} h-32 font-mono`}
              placeholder={'hola — привіт\nadiós — до побачення'}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button className={btnPrimary} onClick={applyPaste} disabled={!paste.trim()}>
                Додати {parseQuickPaste(paste).length || ''} рядків
              </button>
              <span className="text-xs text-zinc-500">Формат: «слово — переклад», по одному на рядок</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="w-8 py-2">#</th>
                <th className="px-1 py-2">Слово</th>
                <th className="px-1 py-2">Переклад</th>
                <th className="px-1 py-2">Приклад</th>
                <th className="px-1 py-2">Переклад прикладу</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="py-1 text-zinc-400">{i + 1}</td>
                  {(['term', 'translation', 'example', 'exampleTranslation'] as const).map((f) => (
                    <td key={f} className="px-1 py-1">
                      <input className={input} value={r[f] ?? ''} onChange={(e) => update(r.key, f, e.target.value)} />
                    </td>
                  ))}
                  <td>
                    <button
                      className={iconBtn}
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
      </div>

      {error && <Message onClose={() => setError(null)}>{error}</Message>}
      <div className="flex justify-end gap-2">
        <button className={btnGhost} onClick={onCancel}>
          Скасувати
        </button>
        <button className={btnPrimary} onClick={save} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}
