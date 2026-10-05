import fs from 'fs'
import path from 'path'
import { Language } from '../models/Language'
import { Block } from '../models/Block'
import { User } from '../models/User'
import { parseBlockInput } from '../utils/blocks'

/**
 * Content JSON lives in src/seed/content. In dev (ts-node) __dirname is src/seed;
 * in the compiled build it is build/seed, so fall back to ../../src/seed/content.
 */
export const findContentDir = (): string | null => {
  const candidates = [
    path.join(__dirname, 'content'),
    path.join(__dirname, '../../src/seed/content'),
    path.join(process.cwd(), 'src/seed/content'),
  ]
  return candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory()) ?? null
}

interface SeedFile {
  language: { code: string; name: string; nativeName: string; flag?: string }
  blocks: any[]
}

const readSeedFiles = (): SeedFile[] => {
  const dir = findContentDir()
  if (!dir) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as SeedFile)
    .filter((s) => s && s.language && typeof s.language.code === 'string' && Array.isArray(s.blocks))
}

const seedLanguage = async (data: SeedFile, force: boolean): Promise<boolean> => {
  const code = data.language.code.toLowerCase()
  const existing = await Block.countDocuments({ language: code })
  if (existing > 0 && !force) return false

  await Language.updateOne(
    { code },
    {
      $set: { name: data.language.name, nativeName: data.language.nativeName, flag: data.language.flag ?? '' },
      $setOnInsert: { code, isActive: true },
    },
    { upsert: true }
  )
  const blocks = data.blocks.map((b, i) => {
    const parsed = parseBlockInput(b)
    return { ...parsed, order: parsed.order ?? i + 1, language: code }
  })
  if (force) await Block.deleteMany({ language: code })
  await Block.insertMany(blocks)
  console.log(`Seeded language "${code}" with ${blocks.length} blocks`)
  return true
}

/** Seed every language (from content JSON) that has no blocks yet; `force` replaces blocks. */
export const seedContent = async (options: { force?: boolean; only?: string[] } = {}) => {
  for (const file of readSeedFiles()) {
    const code = file.language.code.toLowerCase()
    if (options.only?.length && !options.only.includes(code)) continue
    try {
      await seedLanguage(file, !!options.force)
    } catch (error) {
      console.error(`Failed to seed language "${code}":`, (error as Error).message)
    }
  }
}

/** Promote users listed in ADMIN_EMAILS (comma separated) to admin. */
export const bootstrapAdmins = async () => {
  const emails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (!emails.length) return
  const res = await User.updateMany({ email: { $in: emails }, role: { $ne: 'admin' } }, { $set: { role: 'admin' } })
  if (res.modifiedCount) console.log(`Promoted ${res.modifiedCount} user(s) to admin from ADMIN_EMAILS`)
}
