import { Router } from 'express'
import { User } from '../models/User'
import { Language } from '../models/Language'
import { AppError } from '../middleware/errorHandler'
import { LANG_CODE_RE, normalizeProgressMap, serializeUser, validateLangProgress } from '../utils/progress'

// Mounted behind authenticateToken in index.ts
const router = Router()

const MAX_AVATAR_LENGTH = 1_500_000

router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) throw new AppError('User not found', 404)
    res.json(serializeUser(user, true))
  } catch (error) {
    next(error)
  }
})

router.put('/profile', async (req, res, next) => {
  try {
    const { email, nickname, avatar, selectedLanguage } = req.body ?? {}
    const updateData: Record<string, unknown> = {}
    const unset: Record<string, 1> = {}

    if (email !== undefined && email !== null && email !== '') {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) throw new AppError('Invalid email', 400)
      const normalized = email.trim().toLowerCase()
      if (normalized !== req.user.email) {
        const existingUser = await User.findOne({ email: normalized })
        if (existingUser) throw new AppError('Email already exists', 400)
        updateData.email = normalized
      }
    }
    if (nickname !== undefined) {
      if (nickname === null || nickname === '') unset.nickname = 1
      else if (typeof nickname !== 'string') throw new AppError('Invalid nickname', 400)
      else updateData.nickname = nickname
    }
    if (avatar !== undefined) {
      if (avatar === null || avatar === '') unset.avatar = 1
      else if (typeof avatar !== 'string' || avatar.length > MAX_AVATAR_LENGTH) throw new AppError('Invalid avatar', 400)
      else if (!/^(data:image\/[a-z+.-]+;base64,|https?:\/\/)/i.test(avatar)) throw new AppError('Invalid avatar', 400)
      else updateData.avatar = avatar
    }
    if (selectedLanguage !== undefined) {
      if (selectedLanguage === null || selectedLanguage === '') unset.selectedLanguage = 1
      else {
        if (typeof selectedLanguage !== 'string' || !LANG_CODE_RE.test(selectedLanguage)) {
          throw new AppError('Invalid language', 400)
        }
        const lang = await Language.exists({ code: selectedLanguage })
        if (!lang) throw new AppError('Language not found', 400)
        updateData.selectedLanguage = selectedLanguage
      }
    }

    const update: Record<string, unknown> = {}
    if (Object.keys(updateData).length) update.$set = updateData
    if (Object.keys(unset).length) update.$unset = unset

    const user = Object.keys(update).length
      ? await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-password')
      : await User.findById(req.user._id).select('-password')
    if (!user) throw new AppError('User not found', 404)
    res.json(serializeUser(user, true))
  } catch (error: any) {
    if (error?.name === 'ValidationError') return next(new AppError(error.message, 400))
    next(error)
  }
})

router.get('/progress', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('progress')
    if (!user) throw new AppError('User not found', 404)
    res.json(normalizeProgressMap(user.progress))
  } catch (error) {
    next(error)
  }
})

const checkCode = (code: string) => {
  if (!LANG_CODE_RE.test(code)) throw new AppError('Invalid language code', 400)
  return code
}

router.put('/progress/:code', async (req, res, next) => {
  try {
    const code = checkCode(req.params.code)
    if (!(await Language.exists({ code }))) throw new AppError('Language not found', 404)
    const progress = validateLangProgress(req.body)
    const user = await User.findById(req.user._id)
    if (!user) throw new AppError('User not found', 404)
    const map = normalizeProgressMap(user.progress)
    map[code] = progress
    user.progress = map
    user.markModified('progress')
    await user.save()
    res.json(progress)
  } catch (error) {
    next(error)
  }
})

router.delete('/progress/:code', async (req, res, next) => {
  try {
    const code = checkCode(req.params.code)
    const user = await User.findById(req.user._id)
    if (!user) throw new AppError('User not found', 404)
    const map = normalizeProgressMap(user.progress)
    delete map[code]
    user.progress = map
    user.markModified('progress')
    await user.save()
    res.json(map)
  } catch (error) {
    next(error)
  }
})

export default router
