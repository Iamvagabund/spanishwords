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
    const { email, nickname, avatar, selectedLanguage, dailyGoal } = req.body ?? {}
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

    if (dailyGoal !== undefined) {
      if (!Number.isInteger(dailyGoal) || dailyGoal < 5 || dailyGoal > 100) {
        throw new AppError('dailyGoal must be an integer between 5 and 100', 400)
      }
      updateData.dailyGoal = dailyGoal
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

// ---- Daily activity ----

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

/** UTC midnight timestamp of a YYYY-MM-DD string, or NaN if not a real date. */
const dayValue = (date: string) => {
  if (!DATE_RE.test(date)) return NaN
  const t = Date.parse(`${date}T00:00:00Z`)
  return Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== date ? NaN : t
}

const todayValue = () => dayValue(new Date().toISOString().slice(0, 10))

/** Keep only well-formed entries within the last `days` days (relative to server date, +1 day for timezones). */
const recentActivity = (raw: any, days: number): Record<string, number> => {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return out
  const today = todayValue()
  for (const [date, count] of Object.entries(raw)) {
    const t = dayValue(date)
    if (Number.isNaN(t) || typeof count !== 'number' || !Number.isFinite(count) || count < 0) continue
    if (t < today - (days - 1) * DAY_MS || t > today + DAY_MS) continue
    out[date] = count
  }
  return out
}

const activityResponse = (user: any) => ({
  dailyGoal: user.dailyGoal ?? 10,
  activity: recentActivity(user.activity, 90),
})

router.get('/activity', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('activity dailyGoal')
    if (!user) throw new AppError('User not found', 404)
    res.json(activityResponse(user))
  } catch (error) {
    next(error)
  }
})

router.post('/activity', async (req, res, next) => {
  try {
    const { date, delta } = req.body ?? {}
    if (typeof date !== 'string' || Number.isNaN(dayValue(date))) throw new AppError('date must be YYYY-MM-DD', 400)
    if (Math.abs(dayValue(date) - todayValue()) > DAY_MS) throw new AppError('date is too far from today', 400)
    if (!Number.isInteger(delta) || delta < 1 || delta > 100) throw new AppError('delta must be an integer 1-100', 400)
    const user = await User.findById(req.user._id)
    if (!user) throw new AppError('User not found', 404)
    const activity = recentActivity(user.activity, 120)
    activity[date] = (activity[date] ?? 0) + delta
    user.activity = activity
    user.markModified('activity')
    await user.save()
    res.json(activityResponse(user))
  } catch (error) {
    next(error)
  }
})

export default router
