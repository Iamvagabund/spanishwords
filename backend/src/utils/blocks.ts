import mongoose from 'mongoose'
import { AppError } from '../middleware/errorHandler'
import { LEVELS } from '../models/Block'

const str = (v: any, field: string, max: number, required = true): string | undefined => {
  if (v === undefined || v === null || v === '') {
    if (required) throw new AppError(`${field} is required`, 400)
    return undefined
  }
  if (typeof v !== 'string') throw new AppError(`${field} must be a string`, 400)
  const t = v.trim()
  if (required && !t) throw new AppError(`${field} is required`, 400)
  if (t.length > max) throw new AppError(`${field} is too long`, 400)
  return t
}

export interface BlockInput {
  order?: number
  title: string
  titleTarget: string
  description: string
  level: string
  words: Array<{
    _id?: mongoose.Types.ObjectId
    term: string
    translation: string
    example?: string
    exampleTranslation?: string
  }>
  /** undefined = not provided, null = clear */
  tip?: { title: string; body: string } | null
}

/** Parse an optional tip: undefined when absent, null when explicitly cleared. */
export const parseTip = (t: any): BlockInput['tip'] => {
  if (t === undefined) return undefined
  if (t === null || t === '') return null
  if (typeof t !== 'object' || Array.isArray(t)) throw new AppError('Invalid tip', 400)
  const title = str(t.title, 'tip.title', 80, false)
  const body = str(t.body, 'tip.body', 1500, false)
  if (!title && !body) return null
  if (!title || !body) throw new AppError('tip requires both title and body', 400)
  return { title, body }
}

/** Validate a block payload (seed-JSON / admin shape). */
export const parseBlockInput = (b: any): BlockInput => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new AppError('Invalid block', 400)
  let order: number | undefined
  if (b.order !== undefined && b.order !== null) {
    if (!Number.isInteger(b.order) || b.order < 1) throw new AppError('order must be a positive integer', 400)
    order = b.order
  }
  const level = b.level ?? 'A1'
  if (!(LEVELS as readonly string[]).includes(level)) throw new AppError(`level must be one of ${LEVELS.join(', ')}`, 400)
  if (!Array.isArray(b.words) || b.words.length > 500) throw new AppError('words must be an array (max 500)', 400)
  const words = b.words.map((w: any) => {
    if (!w || typeof w !== 'object') throw new AppError('Invalid word', 400)
    const word: BlockInput['words'][number] = {
      term: str(w.term, 'term', 200)!,
      translation: str(w.translation, 'translation', 300)!,
    }
    const ex = str(w.example, 'example', 1000, false)
    const exT = str(w.exampleTranslation, 'exampleTranslation', 1000, false)
    if (ex) word.example = ex
    if (exT) word.exampleTranslation = exT
    const id = w.id ?? w._id
    if (id !== undefined && id !== null) {
      if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid word id', 400)
      word._id = new mongoose.Types.ObjectId(String(id))
    }
    return word
  })
  return {
    order,
    title: str(b.title, 'title', 200)!,
    titleTarget: str(b.titleTarget, 'titleTarget', 200, false) ?? '',
    description: str(b.description, 'description', 1000, false) ?? '',
    level,
    words,
    tip: parseTip(b.tip),
  }
}

/** Strip an absent/cleared tip so it is not stored as null on create. */
export const blockDoc = (input: BlockInput) => {
  const { tip, ...rest } = input
  return tip ? { ...rest, tip } : rest
}
