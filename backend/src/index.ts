import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import userRouter from './routes/user'
import { adminRouter } from './routes/admin'
import { languagesRouter } from './routes/languages'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import { bootstrapAdmins, seedContent } from './seed/seed'
import { runMigrations } from './seed/migrations'

dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env variable is required')
}

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173' }))
// Avatars are sent as data URLs, hence the larger limit
app.use(express.json({ limit: '2mb' }))

app.use('/api/auth', authRouter)
app.use('/api/languages', languagesRouter)
app.use('/api/user', authenticateToken, userRouter)
app.use('/api/admin', adminRouter)

app.use(errorHandler as express.ErrorRequestHandler)

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(async () => {
    console.log('Connected to MongoDB')
    try {
      await seedContent()
      await bootstrapAdmins()
    } catch (error) {
      console.error('Startup seeding failed:', (error as Error).message)
    }
    await runMigrations()
    const port = process.env.PORT || 5000
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  })
