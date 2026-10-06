import { Router } from 'express'
import mongoose from 'mongoose'
import { User } from '../models/User'
import { Language, serializeLanguage } from '../models/Language'
import { Block, serializeBlock } from '../models/Block'
import { AppError } from '../middleware/errorHandler'
import { adminMiddleware, authenticateToken } from '../middleware/auth'
import { blockDoc, parseBlockInput } from '../utils/blocks'
import { Resource, parseResourceInput, serializeResource, sortResources } from '../models/Resource'
import { LANG_CODE_RE, normalizeProgressMap, serializeUser } from '../utils/progress'

const router = Router()

router.use(authenticateToken)
router.use(adminMiddleware)

const requireLanguage = async (code: unknown) => {
  if (typeof code !== 'string' || !LANG_CODE_RE.test(code)) throw new AppError('Invalid language code', 400)
  if (!(await Language.exists({ code }))) throw new AppError('Language not found', 404)
  return code
}

const requireId = (id: unknown) => {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new AppError('Invalid id', 400)
  return id
}

const nextOrder = async (language: string) => {
  const last = await Block.findOne({ language }).sort({ order: -1 }).select('order').lean()
  return (last?.order ?? 0) + 1
}

const textField = (v: unknown, field: string, max = 100) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new AppError(`Invalid ${field}`, 400)
  return v.trim()
}

// ---- Languages ----

router.get('/languages', async (_req, res, next) => {
  try {
    const langs = await Language.find().sort({ code: 1 }).lean()
    res.json(langs.map(serializeLanguage))
  } catch (error) {
    next(error)
  }
})

router.post('/languages', async (req, res, next) => {
  try {
    const { code, name, nativeName, flag } = req.body ?? {}
    if (typeof code !== 'string' || !LANG_CODE_RE.test(code)) throw new AppError('Invalid language code', 400)
    if (await Language.exists({ code })) throw new AppError('Language already exists', 400)
    const lang = await Language.create({
      code,
      name: textField(name, 'name'),
      nativeName: textField(nativeName, 'nativeName'),
      flag: typeof flag === 'string' ? flag.slice(0, 20) : '',
    })
    res.status(201).json(serializeLanguage(lang))
  } catch (error) {
    next(error)
  }
})

router.put('/languages/:code', async (req, res, next) => {
  try {
    const code = await requireLanguage(req.params.code)
    const { name, nativeName, flag, isActive } = req.body ?? {}
    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = textField(name, 'name')
    if (nativeName !== undefined) update.nativeName = textField(nativeName, 'nativeName')
    if (flag !== undefined) {
      if (typeof flag !== 'string' || flag.length > 20) throw new AppError('Invalid flag', 400)
      update.flag = flag
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') throw new AppError('Invalid isActive', 400)
      update.isActive = isActive
    }
    const lang = await Language.findOneAndUpdate({ code }, { $set: update }, { new: true })
    res.json(serializeLanguage(lang))
  } catch (error) {
    next(error)
  }
})

// ---- Blocks ----

router.get('/blocks', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.query.language)
    const blocks = await Block.find({ language }).sort({ order: 1 }).lean()
    res.json(blocks.map(serializeBlock))
  } catch (error) {
    next(error)
  }
})

router.post('/blocks', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.body?.language)
    const input = parseBlockInput(req.body)
    const order = input.order ?? (await nextOrder(language))
    if (await Block.exists({ language, order })) throw new AppError('A block with this order already exists', 400)
    const block = await Block.create({ ...blockDoc(input), order, language })
    res.status(201).json(serializeBlock(block))
  } catch (error) {
    next(error)
  }
})

router.post('/blocks/reorder', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.body?.language)
    const ids = req.body?.ids
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && mongoose.isValidObjectId(id))) {
      throw new AppError('ids must be an array of block ids', 400)
    }
    const existing = await Block.find({ language }).select('_id').lean()
    const existingIds = new Set(existing.map((b) => String(b._id)))
    if (ids.length !== existingIds.size || new Set(ids).size !== ids.length || !ids.every((id) => existingIds.has(id))) {
      throw new AppError('ids must contain every block of the language exactly once', 400)
    }
    // Two phases to avoid clashing with the unique (language, order) index
    await Block.bulkWrite(
      ids.map((id: string, i: number) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: -(i + 1) } } } }))
    )
    await Block.bulkWrite(
      ids.map((id: string, i: number) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } } }))
    )
    const blocks = await Block.find({ language }).sort({ order: 1 }).lean()
    res.json(blocks.map(serializeBlock))
  } catch (error) {
    next(error)
  }
})

router.post('/blocks/import', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.body?.language)
    const blocks = req.body?.blocks
    if (!Array.isArray(blocks) || !blocks.length || blocks.length > 500) {
      throw new AppError('blocks must be a non-empty array (max 500)', 400)
    }
    const parsed = blocks.map(parseBlockInput)
    const start = await nextOrder(language)
    const docs = parsed.map((b, i) => ({ ...blockDoc(b), order: start + i, language }))
    const created = await Block.insertMany(docs)
    res.status(201).json(created.map(serializeBlock))
  } catch (error) {
    next(error)
  }
})

router.put('/blocks/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const block = await Block.findById(id)
    if (!block) throw new AppError('Block not found', 404)
    const input = parseBlockInput(req.body)
    const order = input.order ?? block.order
    if (order !== block.order && (await Block.exists({ language: block.language, order, _id: { $ne: block._id } }))) {
      throw new AppError('A block with this order already exists', 400)
    }
    const { tip, ...rest } = input
    block.set({ ...rest, order })
    // tip omitted = keep, null/empty = clear
    if (tip === null) block.set('tip', undefined)
    else if (tip) block.set('tip', tip)
    await block.save()
    res.json(serializeBlock(block))
  } catch (error) {
    next(error)
  }
})

router.delete('/blocks/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const block = await Block.findByIdAndDelete(id)
    if (!block) throw new AppError('Block not found', 404)
    res.json({ status: 'success' })
  } catch (error) {
    next(error)
  }
})

// ---- Resources ----

router.get('/resources', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.query.language)
    const items = await Resource.find({ language }).lean()
    res.json(sortResources(items).map(serializeResource))
  } catch (error) {
    next(error)
  }
})

router.post('/resources', async (req, res, next) => {
  try {
    const language = await requireLanguage(req.body?.language)
    const input = parseResourceInput(req.body, false)
    if (input.order === undefined) {
      const last = await Resource.findOne({ language }).sort({ order: -1 }).select('order').lean()
      input.order = (last?.order ?? 0) + 1
    }
    const created = await Resource.create({ ...input, language })
    res.status(201).json(serializeResource(created))
  } catch (error) {
    next(error)
  }
})

router.put('/resources/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const resource = await Resource.findById(id)
    if (!resource) throw new AppError('Resource not found', 404)
    const input = parseResourceInput(req.body, true)
    for (const [k, v] of Object.entries(input)) resource.set(k, v === null ? undefined : v)
    await resource.save()
    res.json(serializeResource(resource))
  } catch (error) {
    next(error)
  }
})

router.delete('/resources/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const resource = await Resource.findByIdAndDelete(id)
    if (!resource) throw new AppError('Resource not found', 404)
    res.json({ status: 'success' })
  } catch (error) {
    next(error)
  }
})

// ---- Users ----

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean()
    res.json(
      users.map((u) => {
        const progress = normalizeProgressMap(u.progress)
        const summary: Record<string, { completedBlocks: number; averageScore: number; learnedWords: number }> = {}
        for (const [code, p] of Object.entries(progress)) {
          summary[code] = {
            completedBlocks: p.completedBlocks.length,
            averageScore: p.averageScore,
            learnedWords: p.learnedWords.length,
          }
        }
        return { ...serializeUser(u), progress: summary }
      })
    )
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const role = req.body?.role
    if (role !== 'user' && role !== 'admin') throw new AppError("role must be 'user' or 'admin'", 400)
    if (id === String(req.user._id) && role !== 'admin') throw new AppError('You cannot remove your own admin role', 400)
    const user = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).select('-password')
    if (!user) throw new AppError('User not found', 404)
    res.json(serializeUser(user, true))
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/reset-progress', async (req, res, next) => {
  try {
    const id = requireId(req.params.id)
    const language = req.body?.language
    if (language !== undefined && language !== null && (typeof language !== 'string' || !LANG_CODE_RE.test(language))) {
      throw new AppError('Invalid language code', 400)
    }
    const user = await User.findById(id)
    if (!user) throw new AppError('User not found', 404)
    const map = normalizeProgressMap(user.progress)
    if (language) delete map[language]
    user.progress = language ? map : {}
    user.markModified('progress')
    await user.save()
    res.json(serializeUser(user, true))
  } catch (error) {
    next(error)
  }
})

// ---- Statistics ----

router.get('/statistics', async (_req, res, next) => {
  try {
    const [totalUsers, totalAdmins, languages, blockStats, users] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Language.find().sort({ code: 1 }).lean(),
      Block.aggregate([
        { $group: { _id: '$language', blocks: { $sum: 1 }, words: { $sum: { $size: '$words' } } } },
      ]),
      User.find().select('progress').lean(),
    ])
    const blockMap = new Map(blockStats.map((b: any) => [b._id, b]))
    const perLanguage = languages.map((l) => {
      let learners = 0
      let completedBlocks = 0
      let scoreSum = 0
      for (const u of users) {
        const p = normalizeProgressMap(u.progress)[l.code]
        if (!p || !p.completedBlocks.length) continue
        learners++
        completedBlocks += p.completedBlocks.length
        scoreSum += p.completedBlocks.reduce((s, c) => s + c.score, 0)
      }
      const bs: any = blockMap.get(l.code)
      return {
        code: l.code,
        learners,
        blocks: bs?.blocks ?? 0,
        words: bs?.words ?? 0,
        avgScore: completedBlocks ? Math.round((scoreSum / completedBlocks) * 100) / 100 : 0,
        completedBlocks,
      }
    })
    res.json({ totalUsers, totalAdmins, perLanguage })
  } catch (error) {
    next(error)
  }
})

export const adminRouter = router
