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

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    console.log('Auth header:', authHeader)
    
    if (!authHeader) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    console.log('Token:', token)
    
    if (!token) {
      throw new AppError('Invalid token format', 401)
    }

    try {
      console.log('JWT Secret:', process.env.JWT_SECRET || 'fallback-secret')
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload
      console.log('Decoded token:', decoded)
      
      const user = await User.findById(decoded.userId).select('-password')
      console.log('Found user:', user)
      
      if (!user) {
        throw new AppError('User not found', 404)
      }

      req.user = user
      next()
    } catch (error) {
      console.error('JWT verification error:', error)
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401)
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
}

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('Checking admin role...')
  console.log('User role:', req.user?.role)
  if (req.user?.role !== 'admin') {
    console.log('Admin access denied')
    return res.status(403).json({ message: 'Admin access required' })
  }
  console.log('Admin access granted')
  next()
}

export { authenticateToken, adminMiddleware } 