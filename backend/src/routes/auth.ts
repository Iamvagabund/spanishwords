import { Router } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User } from '../models/User'
import { AppError } from '../middleware/errorHandler'

const router = Router()

const signToken = (userId: unknown) => {
  const options: SignOptions = { expiresIn: '7d' }
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET!, options)
}

const authUser = (user: any) => ({
  id: String(user._id),
  email: user.email,
  nickname: user.nickname,
  avatar: user.avatar,
  role: user.role,
  selectedLanguage: user.selectedLanguage,
})

const readCredentials = (body: any) => {
  const email = body?.email
  const password = body?.password
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new AppError('Email and password are required', 400)
  }
  return { email: email.trim().toLowerCase(), password }
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = readCredentials(req.body)
    if (password.length < 6) throw new AppError('Password must be at least 6 characters long', 400)

    const existingUser = await User.findOne({ email })
    if (existingUser) throw new AppError('Email already exists', 400)

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
    const user = await User.create({
      email,
      password,
      role: adminEmails.includes(email) ? 'admin' : 'user',
    })

    res.status(201).json({ user: authUser(user), token: signToken(user._id) })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = readCredentials(req.body)
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401)
    }
    res.json({ user: authUser(user), token: signToken(user._id) })
  } catch (error) {
    next(error)
  }
})

export const authRouter = router
