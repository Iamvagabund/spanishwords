import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { AppError } from '../middleware/errorHandler'

interface JwtPayload {
  userId: string
}

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

const authenticateToken = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) throw new AppError('No token provided', 401)
    const [scheme, token] = authHeader.split(' ')
    if (scheme !== 'Bearer' || !token) throw new AppError('Invalid token format', 401)

    let decoded: JwtPayload
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    } catch {
      throw new AppError('Invalid token', 401)
    }

    const user = await User.findById(decoded.userId).select('-password')
    if (!user) throw new AppError('User not found', 401)
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

const adminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return next(new AppError('Admin access required', 403))
  next()
}

export { authenticateToken, adminMiddleware }
