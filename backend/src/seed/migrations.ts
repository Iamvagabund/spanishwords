import fs from 'fs'
import path from 'path'
import { Block } from '../models/Block'
import { Migration } from '../models/Migration'
import { blockDoc, parseBlockInput } from '../utils/blocks'
import { findContentDir, readSeedFiles } from './seed'

interface ChangesFile {
  id: string
  relevel?: { language: string; order: number; level: string }[]
  replaceWords?: {
    language: string
    order: number
    oldTerm: string
    term: string
    translation: string
    example?: string
    exampleTranslation?: string
  }[]
}

const readChangeFiles = (): { file: string; data: ChangesFile }[] => {
  const dir = findContentDir()
  if (!dir) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('changes-') && f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as ChangesFile }))
    .filter((c) => c.data && typeof c.data.id === 'string' && c.data.id)
}

const applyRelevel = async (items: ChangesFile['relevel'] = []) => {
  let n = 0
  for (const r of items) {
    const res = await Block.updateOne(
      { language: String(r.language).toLowerCase(), order: r.order, level: { $ne: r.level } },
      { $set: { level: r.level } }
    )
    n += res.modifiedCount
  }
  return n
}

const applyReplaceWords = async (items: ChangesFile['replaceWords'] = []) => {
  let n = 0
  for (const r of items) {
    const block = await Block.findOne({ language: String(r.language).toLowerCase(), order: r.order })
    if (!block) continue
    const word = block.words.find((w) => w.term === r.oldTerm)
    // Same term is allowed (translation/example fix); skip only if another word already uses it
    if (!word || block.words.some((w) => w !== word && w.term === r.term)) continue
    word.term = r.term
    word.translation = r.translation
    word.example = r.example || undefined
    word.exampleTranslation = r.exampleTranslation || undefined
    await block.save()
    n++
  }
  return n
}

/** Append seed blocks whose titleTarget isn't present in the DB for that language. */
const appendMissingBlocks = async () => {
  const summary: string[] = []
  for (const file of readSeedFiles()) {
    const code = file.language.code.toLowerCase()
    const existing = await Block.find({ language: code }, { titleTarget: 1, order: 1 }).lean()
    if (!existing.length) continue // fresh language is handled by normal seeding
    const titles = new Set(existing.map((b) => (b.titleTarget || '').trim()))
    let next = Math.max(...existing.map((b) => b.order)) + 1
    const sorted = file.blocks
      .map((b, i) => ({ b, i, order: Number.isInteger(b?.order) ? b.order : i + 1 }))
      .sort((a, z) => a.order - z.order || a.i - z.i)
    const docs: any[] = []
    for (const { b } of sorted) {
      const parsed = parseBlockInput(b)
      const key = (parsed.titleTarget || '').trim()
      if (titles.has(key)) continue
      titles.add(key)
      docs.push({ ...blockDoc(parsed), order: next++, language: code })
    }
    if (docs.length) {
      await Block.insertMany(docs)
      summary.push(`${code}+${docs.length}`)
    }
  }
  return summary
}

/** Apply pending changes-*.json migrations. Never throws; returns false on error. */
export const runMigrations = async (): Promise<boolean> => {
  try {
    for (const { file, data } of readChangeFiles()) {
      if (await Migration.exists({ id: data.id })) continue
      const relevelled = await applyRelevel(data.relevel)
      const replaced = await applyReplaceWords(data.replaceWords)
      const appended = await appendMissingBlocks()
      await Migration.create({ id: data.id, appliedAt: new Date() })
      console.log(
        `Migration "${data.id}" (${file}) applied: relevel ${relevelled}, replaced words ${replaced}, appended blocks ${appended.join(', ') || 'none'}`
      )
    }
    return true
  } catch (error) {
    console.error('Content migration failed:', (error as Error).message)
    return false
  }
}
