import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface CompletedBlock {
  blockId: string
  score: number
  completedAt: string
}

export interface LangProgress {
  completedBlocks: CompletedBlock[]
  mistakes: Record<string, number>
  learnedWords: string[]
  currentLevel: number
  averageScore: number
}

export interface IUser extends mongoose.Document {
  email: string
  password: string
  nickname?: string
  avatar?: string
  role: 'user' | 'admin'
  selectedLanguage?: string
  // Stored as a plain object keyed by language code (Mixed) so legacy
  // documents with the old flat progress shape never fail to cast.
  // Always read through normalizeProgressMap().
  progress: any
  activity: Record<string, number>
  dailyGoal: number
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    nickname: {
      type: String,
      trim: true,
      minlength: [2, 'Nickname must be at least 2 characters long'],
      maxlength: [30, 'Nickname cannot be longer than 30 characters'],
    },
    avatar: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    selectedLanguage: { type: String, trim: true, lowercase: true },
    progress: { type: mongoose.Schema.Types.Mixed, default: {} },
    activity: { type: mongoose.Schema.Types.Mixed, default: {} },
    dailyGoal: { type: Number, default: 10, min: 5, max: 100 },
  },
  { timestamps: true, minimize: false }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
