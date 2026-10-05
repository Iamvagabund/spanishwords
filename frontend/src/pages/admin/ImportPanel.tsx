import { useMemo, useState } from 'react'
import { adminApi, type ImportBlock, LEVELS, type Level } from '../../services/adminApi'
import { btnGhost, btnPrimary, card, errMsg, input, Message } from './ui'

interface Parsed {
  blocks: ImportBlock[]
  errors: string[]
}

export function validateImport(text: string): Parsed {
  const errors: string[] = []
  if (!text.trim()) return { blocks: [], errors }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { blocks: [], errors: [`Некоректний JSON: ${errMsg(e)}`] }
  }
  // Accept a bare array or a full seed file { language, blocks }.
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { blocks?: unknown }).blocks)
      ? (raw as { blocks: unknown[] }).blocks
      : null
  if (!arr) return { blocks: [], errors: ['Очікується масив блоків або обʼєкт { blocks: [...] }'] }

  const blocks: ImportBlock[] = []
  arr.forEach((b, i) => {
    const n = `Блок ${i + 1}`
    if (!b || typeof b !== 'object') return errors.push(`${n}: не обʼєкт`)
    const o = b as Record<string, unknown>
    const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim() : '')
    if (!str('title')) errors.push(`${n}: відсутнє поле title`)
    if (!str('titleTarget')) errors.push(`${n}: відсутнє поле titleTarget`)
    const level = (str('level') || 'A1') as Level
    if (!LEVELS.includes(level)) errors.push(`${n}: невірний level «${level}»`)
    if (!Array.isArray(o.words) || !o.words.length) {
      errors.push(`${n}: words має бути непорожнім масивом`)
      return
    }
    const words = (o.words as unknown[]).map((w, j) => {
      const x = (w ?? {}) as Record<string, unknown>
      const term = typeof x.term === 'string' ? x.term.trim() : ''
      const translation = typeof x.translation === 'string' ? x.translation.trim() : ''
      if (!term || !translation) errors.push(`${n}, слово ${j + 1}: потрібні term і translation`)
      return {
        term,
        translation,
        ...(typeof x.example === 'string' && x.example ? { example: x.example } : {}),
        ...(typeof x.exampleTranslation === 'string' && x.exampleTranslation
          ? { exampleTranslation: x.exampleTranslation }
          : {}),
      }
    })
    blocks.push({
      title: str('title'),
      titleTarget: str('titleTarget'),
      description: str('description'),
      level,
      words,
    })
  })
  return { blocks, errors }
}

export default function ImportPanel({
  language,
  onDone,
  onCancel,
}: {
  language: string
  onDone: (count: number) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const parsed = useMemo(() => validateImport(text), [text])

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setText(await f.text())
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await adminApi.importBlocks(language, parsed.blocks)
      onDone(parsed.blocks.length)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const canImport = parsed.blocks.length > 0 && parsed.errors.length === 0

  return (
    <div className={`${card} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Імпорт блоків ({language.toUpperCase()})
        </h2>
        <button className={btnGhost} onClick={onCancel}>
          ← Назад
        </button>
      </div>
      <p className="text-sm text-zinc-500">
        Вставте JSON-масив блоків (формат seed: title, titleTarget, description, level, words[]) або завантажте файл.
        Блоки буде додано після останнього.
      </p>
      <label className={`${btnGhost} cursor-pointer`}>
        Завантажити .json
        <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <textarea
        className={`${input} h-56 font-mono text-xs`}
        placeholder='[{ "title": "Привітання", "titleTarget": "Saludos", "level": "A1", "words": [{ "term": "hola", "translation": "привіт" }] }]'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {parsed.errors.length > 0 && (
        <Message>
          <ul className="list-disc space-y-0.5 pl-4">
            {parsed.errors.slice(0, 15).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {parsed.errors.length > 15 && <li>…ще {parsed.errors.length - 15}</li>}
          </ul>
        </Message>
      )}

      {parsed.blocks.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Попередній перегляд: {parsed.blocks.length} блоків,{' '}
            {parsed.blocks.reduce((s, b) => s + b.words.length, 0)} слів
          </h3>
          <div className="max-h-64 divide-y divide-zinc-200 overflow-y-auto rounded-xl border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
            {parsed.blocks.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 text-zinc-800 dark:text-zinc-200">
                <span className="w-6 text-zinc-400">{i + 1}</span>
                <span className="flex-1 truncate">
                  {b.title} <span className="text-zinc-500">/ {b.titleTarget}</span>
                </span>
                <span className="rounded bg-zinc-100 px-1.5 text-xs dark:bg-zinc-800">{b.level}</span>
                <span className="w-16 text-right text-zinc-500">{b.words.length} сл.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <Message onClose={() => setError(null)}>{error}</Message>}
      <div className="flex justify-end">
        <button className={btnPrimary} disabled={!canImport || busy} onClick={submit}>
          {busy ? 'Імпорт…' : `Імпортувати ${parsed.blocks.length || ''}`}
        </button>
      </div>
    </div>
  )
}
