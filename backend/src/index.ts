import express, { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import userRouter from './routes/user'
import { adminRouter } from './routes/admin'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRouter)
app.use('/api/user', authenticateToken, userRouter)
app.use('/api/admin', adminRouter)

// Error handling
app.use(errorHandler as express.ErrorRequestHandler)

// Database connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB')
    const port = process.env.PORT || 5000
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
  }) 