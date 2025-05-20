import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { User } from '../models/User'

dotenv.config()

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    const existingAdmin = await User.findOne({ email: adminEmail })
    if (existingAdmin) {
      console.log('Admin user already exists')
      process.exit(0)
    }

    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    })

    console.log('Admin user created successfully:', admin.email)
    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin() 