import mongoose from 'mongoose'
import { AppError } from '../middleware/errorHandler'

export const RESOURCE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'all'] as const
export const RESOURCE_TYPES = ['book', 'podcast', 'youtube', 'app', 'website', 'series'] as const

export interface IResource extends mongoose.Document {
  language: string
  level: string
  type: string
  title: string
  author?: string
  description: string
  url: string
  order: number
}

const resourceSchema = new mongoose.Schema(
  {
    language: { type: String, required: true, index: true, lowercase: true, trim: true },
    level: { type: String, enum: RESOURCE_LEVELS, default: 'all' },
    type: { type: String, enum: RESOURCE_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    url: { type: String, required: true, trim: true, maxlength: 1000 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Resource = mongoose.model<IResource>('Resource', resourceSchema)

export const serializeResource = (r: any) => ({
  id: String(r._id),
  level: r.level,
  type: r.type,
  title: r.title,
  ...(r.author ? { author: r.author } : {}),
  description: r.description ?? '',
  url: r.url,
  order: r.order ?? 0,
})

/** Sort by level (A1..C2, then "all") then order. */
export const sortResources = <T extends { level: string; order?: number }>(items: T[]): T[] => {
  const idx = (l: string) => {
    const i = (RESOURCE_LEVELS as readonly string[]).indexOf(l)
    return i < 0 ? RESOURCE_LEVELS.length : i
  }
  return [...items].sort((a, b) => idx(a.level) - idx(b.level) || (a.order ?? 0) - (b.order ?? 0))
}

export interface ResourceInput {
  level?: string
  type?: string
  title?: string
  author?: string | null
  description?: string
  url?: string
  order?: number
}

const text = (v: any, field: string, max: number, allowEmpty = false): string => {
  if (typeof v !== 'string') throw new AppError(`${field} must be a string`, 400)
  const t = v.trim()
  if (!allowEmpty && !t) throw new AppError(`${field} is required`, 400)
  if (t.length > max) throw new AppError(`${field} is too long`, 400)
  return t
}

/** Validate a resource payload. `partial` = PUT semantics (only provided fields; author null clears). */
export const parseResourceInput = (b: any, partial: boolean): ResourceInput => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new AppError('Invalid resource', 400)
  const out: ResourceInput = {}
  const has = (k: string) => b[k] !== undefined
  if (has('level') || !partial) {
    const level = b.level ?? 'all'
    if (!(RESOURCE_LEVELS as readonly string[]).includes(level)) {
      throw new AppError(`level must be one of ${RESOURCE_LEVELS.join(', ')}`, 400)
    }
    out.level = level
  }
  if (has('type') || !partial) {
    if (!(RESOURCE_TYPES as readonly string[]).includes(b.type)) {
      throw new AppError(`type must be one of ${RESOURCE_TYPES.join(', ')}`, 400)
    }
    out.type = b.type
  }
  if (has('title') || !partial) out.title = text(b.title, 'title', 200)
  if (has('description') || !partial) out.description = text(b.description ?? '', 'description', 1000, true)
  if (has('url') || !partial) {
    const url = text(b.url, 'url', 1000)
    let ok = false
    try {
      const u = new URL(url)
      ok = u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      ok = false
    }
    if (!ok) throw new AppError('url must be an http(s) URL', 400)
    out.url = url
  }
  if (has('author')) {
    if (b.author === null || b.author === '') {
      if (partial) out.author = null
    } else out.author = text(b.author, 'author', 200)
  }
  if (has('order') && b.order !== null) {
    if (!Number.isInteger(b.order) || b.order < 0) throw new AppError('order must be a non-negative integer', 400)
    out.order = b.order
  }
  return out
}
