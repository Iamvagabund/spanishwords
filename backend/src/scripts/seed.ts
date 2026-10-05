/**
 * Usage: npm run seed [-- --force] [-- es en]
 * Without --force only languages with zero blocks are seeded.
 * With --force the listed languages (or all) have their blocks replaced.
 * NOTE: --force regenerates block/word ids, so existing user progress for that language
 * will no longer match.
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { seedContent } from '../seed/seed'

dotenv.config()

const run = async () => {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const only = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase())
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    await seedContent({ force, only })
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', (error as Error).message)
    process.exit(1)
  }
}

run()
