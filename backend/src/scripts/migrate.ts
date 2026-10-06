/** Usage: npm run migrate — applies pending content migrations (changes-*.json). */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { runMigrations } from '../seed/migrations'

dotenv.config()

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    const ok = await runMigrations()
    await mongoose.disconnect()
    process.exit(ok ? 0 : 1)
  } catch (error) {
    console.error('Migration failed:', (error as Error).message)
    process.exit(1)
  }
}

run()
