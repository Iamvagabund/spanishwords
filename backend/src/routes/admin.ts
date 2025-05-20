import { Router } from 'express'
import { User } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import { adminMiddleware, authenticateToken } from '../middleware/auth'

const router = Router()

// Apply auth and admin middleware to all routes
router.use(authenticateToken)
router.use(adminMiddleware)

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    next(error)
  }
})

// Get global statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$progress.currentLevel',
          count: { $sum: 1 },
          averageScore: { $avg: '$progress.averageScore' },
          totalBlocks: { $sum: { $size: '$progress.completedBlocks' } }
        }
      }
    ])

    const totalUsers = await User.countDocuments()
    const totalAdmins = await User.countDocuments({ role: 'admin' })

    res.json({
      levelStats: stats,
      totalUsers,
      totalAdmins
    })
  } catch (error) {
    next(error)
  }
})

// Reset user statistics
router.post('/reset-stats/:userId', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          'progress.currentLevel': 1,
          'progress.completedBlocks': [],
          'progress.mistakes': {},
          'progress.averageScore': 0,
          'progress.currentBlock': 'block1'
        }
      },
      { new: true }
    ).select('-password')

    if (!user) {
      throw new AppError('User not found', 404)
    }

    res.json(user)
  } catch (error) {
    next(error)
  }
})

// Reset all users achievements
router.post('/reset-all-achievements', async (req, res, next) => {
  try {
    console.log('Starting reset all achievements...')
    console.log('Request user:', req.user)
    
    // Знаходимо всіх користувачів
    const users = await User.find()
    console.log(`Found ${users.length} users to reset`)
    
    // Оновлюємо кожного користувача окремо
    for (const user of users) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            progress: {
              currentLevel: 1,
              completedBlocks: [],
              mistakes: {},
              averageScore: 0,
              currentBlock: 'block1'
            }
          }
        },
        { new: true }
      )
    }

    // Перевіряємо результат
    const usersAfterReset = await User.find()
    console.log('Users after reset:', usersAfterReset.map(u => ({
      id: u._id,
      progress: u.progress
    })))

    console.log('Reset completed successfully')
    res.json({ message: 'All users achievements have been reset' })
  } catch (error) {
    console.error('Error resetting achievements:', error)
    next(error)
  }
})

export const adminRouter = router 