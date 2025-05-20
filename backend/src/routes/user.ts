import { Router } from 'express'
import { User, IUser } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import { authenticateToken } from '../middleware/auth'
import { Request, Response } from 'express'

const router = Router()

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    console.log('Getting profile for user:', req.user._id)
    const user = await User.findById(req.user._id).select('-password')
    console.log('Found user:', user)
    res.json(user)
  } catch (error) {
    console.error('Error getting profile:', error)
    next(error)
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    console.log('Updating profile for user:', req.user._id)
    console.log('Update data:', req.body)

    const { email, nickname, avatar, progress } = req.body

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new AppError('Email already exists', 400)
      }
    }

    const updateData: any = {}
    if (email) updateData.email = email
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatar !== undefined) updateData.avatar = avatar
    if (progress !== undefined) updateData.progress = progress

    console.log('Final update data:', updateData)

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password')

    console.log('Updated user:', user)

    if (!user) {
      throw new AppError('User not found', 404)
    }

    res.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    next(error)
  }
})

// Get user progress
router.get('/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' })
    }
    res.json(user.progress)
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' })
  }
})

// Update user progress
router.post('/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' })
    }
    user.progress = req.body.progress
    await user.save()
    res.json(user.progress)
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' })
  }
})

// Reset user progress
router.post('/reset-progress', authenticateToken, async (req, res, next) => {
  try {
    console.log('Resetting progress for user:', req.user._id)
    
    const initialProgress = {
      currentLevel: 1,
      completedBlocks: [],
      mistakes: {},
      averageScore: 0,
      currentBlock: 'block1'
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { progress: initialProgress } },
      { new: true }
    ).select('-password')

    console.log('Updated user:', user)

    if (!user) {
      throw new AppError('User not found', 404)
    }

    res.json(user)
  } catch (error) {
    console.error('Error resetting progress:', error)
    next(error)
  }
})

export default router 