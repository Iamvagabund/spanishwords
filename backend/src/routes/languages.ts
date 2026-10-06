import { Router } from 'express'
import { Language } from '../models/Language'
import { Block, serializeBlock } from '../models/Block'
import { Resource, serializeResource, sortResources } from '../models/Resource'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const languages = await Language.find({ isActive: true }).sort({ code: 1 }).lean()
    const counts = await Block.aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }])
    const countMap = new Map(counts.map((c: any) => [c._id, c.count]))
    res.json(
      languages.map((l) => ({
        code: l.code,
        name: l.name,
        nativeName: l.nativeName,
        flag: l.flag,
        blockCount: countMap.get(l.code) ?? 0,
      }))
    )
  } catch (error) {
    next(error)
  }
})

router.get('/:code/blocks', async (req, res, next) => {
  try {
    const code = String(req.params.code).toLowerCase()
    const lang = await Language.findOne({ code, isActive: true }).lean()
    if (!lang) throw new AppError('Language not found', 404)
    const blocks = await Block.find({ language: code }).sort({ order: 1 }).lean()
    res.json(blocks.map(serializeBlock))
  } catch (error) {
    next(error)
  }
})

router.get('/:code/resources', async (req, res, next) => {
  try {
    const code = String(req.params.code).toLowerCase()
    const lang = await Language.findOne({ code, isActive: true }).lean()
    if (!lang) throw new AppError('Language not found', 404)
    const items = await Resource.find({ language: code }).lean()
    res.json(sortResources(items).map(serializeResource))
  } catch (error) {
    next(error)
  }
})

export const languagesRouter = router
