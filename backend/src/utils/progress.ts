import { LangProgress } from '../models/User'
import { AppError } from '../middleware/errorHandler'

export const LANG_CODE_RE = /^[a-z]{2,8}$/
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/

export const emptyProgress = (): LangProgress => ({
  completedBlocks: [],
  mistakes: {},
  learnedWords: [],
  currentLevel: 1,
  averageScore: 0,
})

const num = (v: any, def: number) => (typeof v === 'number' && Number.isFinite(v) ? v : def)

/** Lenient normalization of stored data (never throws). */
export const normalizeLangProgress = (raw: any): LangProgress => {
  const p = emptyProgress()
  if (!raw || typeof raw !== 'object') return p
  if (Array.isArray(raw.completedBlocks)) {
    p.completedBlocks = raw.completedBlocks
      .filter((c: any) => c && typeof c === 'object' && typeof c.blockId === 'string')
      .map((c: any) => ({
        blockId: c.blockId,
        score: Math.min(10, Math.max(1, num(c.score, 1))),
        completedAt: typeof c.completedAt === 'string' ? c.completedAt : new Date(0).toISOString(),
      }))
  }
  if (raw.mistakes && typeof raw.mistakes === 'object' && !Array.isArray(raw.mistakes)) {
    for (const [k, v] of Object.entries(raw.mistakes)) {
      if (typeof v === 'number' && Number.isFinite(v)) p.mistakes[k] = v
    }
  }
  if (Array.isArray(raw.learnedWords)) p.learnedWords = raw.learnedWords.filter((w: any) => typeof w === 'string')
  p.currentLevel = num(raw.currentLevel, 1)
  p.averageScore = num(raw.averageScore, 0)
  return p
}

/** Stored user.progress -> { [code]: LangProgress }. Legacy flat format yields {}. */
export const normalizeProgressMap = (raw: any): Record<string, LangProgress> => {
  const out: Record<string, LangProgress> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const obj = raw instanceof Map ? Object.fromEntries(raw) : raw
  for (const [code, val] of Object.entries(obj)) {
    if (!LANG_CODE_RE.test(code)) continue
    if (!val || typeof val !== 'object' || !Array.isArray((val as any).completedBlocks)) continue
    out[code] = normalizeLangProgress(val)
  }
  return out
}

/** Strict validation of client-submitted LangProgress. */
export const validateLangProgress = (body: any): LangProgress => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('Invalid progress', 400)
  const p = emptyProgress()
  const cb = body.completedBlocks ?? []
  if (!Array.isArray(cb) || cb.length > 1000) throw new AppError('Invalid completedBlocks', 400)
  const seen = new Set<string>()
  for (const c of cb) {
    if (!c || typeof c !== 'object' || typeof c.blockId !== 'string' || !ID_RE.test(c.blockId)) {
      throw new AppError('Invalid completedBlocks entry', 400)
    }
    if (typeof c.score !== 'number' || !Number.isFinite(c.score)) throw new AppError('Invalid score', 400)
    if (seen.has(c.blockId)) continue
    seen.add(c.blockId)
    let completedAt = new Date().toISOString()
    if (c.completedAt !== undefined && c.completedAt !== null) {
      const d = new Date(c.completedAt)
      if (typeof c.completedAt !== 'string' || isNaN(d.getTime())) throw new AppError('Invalid completedAt', 400)
      completedAt = d.toISOString()
    }
    p.completedBlocks.push({ blockId: c.blockId, score: Math.min(10, Math.max(1, c.score)), completedAt })
  }
  const m = body.mistakes ?? {}
  if (typeof m !== 'object' || Array.isArray(m)) throw new AppError('Invalid mistakes', 400)
  const entries = Object.entries(m)
  if (entries.length > 20000) throw new AppError('Too many mistakes entries', 400)
  for (const [k, v] of entries) {
    if (!ID_RE.test(k) || typeof v !== 'number' || !Number.isFinite(v)) throw new AppError('Invalid mistakes entry', 400)
    p.mistakes[k] = Math.max(0, Math.min(1e6, Math.floor(v)))
  }
  const lw = body.learnedWords ?? []
  if (!Array.isArray(lw) || lw.length > 50000) throw new AppError('Invalid learnedWords', 400)
  for (const w of lw) if (typeof w !== 'string' || !ID_RE.test(w)) throw new AppError('Invalid learnedWords entry', 400)
  p.learnedWords = Array.from(new Set(lw as string[]))
  if (body.currentLevel !== undefined) {
    if (typeof body.currentLevel !== 'number' || !Number.isFinite(body.currentLevel)) throw new AppError('Invalid currentLevel', 400)
    p.currentLevel = Math.max(1, Math.floor(body.currentLevel))
  }
  if (body.averageScore !== undefined) {
    if (typeof body.averageScore !== 'number' || !Number.isFinite(body.averageScore)) throw new AppError('Invalid averageScore', 400)
    p.averageScore = Math.min(10, Math.max(0, body.averageScore))
  }
  return p
}

/** Public user shape (no password, normalized progress). */
export const serializeUser = (u: any, withProgress = false) => ({
  id: String(u._id),
  _id: String(u._id),
  email: u.email,
  nickname: u.nickname,
  avatar: u.avatar,
  role: u.role,
  selectedLanguage: u.selectedLanguage,
  dailyGoal: u.dailyGoal ?? 10,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  ...(withProgress ? { progress: normalizeProgressMap(u.progress) } : {}),
})
