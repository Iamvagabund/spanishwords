import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends mongoose.Document {
  email: string
  password: string
  nickname?: string
  avatar?: string
  role: string
  progress: {
    currentLevel: number
    completedBlocks: string[]
    mistakes: Record<string, number>
    averageScore: number
    currentBlock: string
  }
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
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    progress: {
      currentLevel: { type: Number, default: 1 },
      completedBlocks: [{ type: String }],
      mistakes: { type: Object, default: {} },
      averageScore: { type: Number, default: 0 },
      currentBlock: { type: String, default: 'block1' }
    }
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
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

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Logging middleware
userSchema.pre('save', function (next) {
  console.log('Saving user:', {
    id: this._id,
    email: this.email,
    nickname: this.nickname,
    avatar: this.avatar,
    role: this.role,
    progress: this.progress
  })
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  console.log('Updating user with data:', {
    filter: this.getQuery(),
    update: this.getUpdate()
  })
  next()
})

userSchema.post('findOneAndUpdate', function (doc) {
  console.log('Updated user result:', {
    id: doc?._id,
    progress: doc?.progress
  })
})

// Перевірка при збереженні
userSchema.pre('save', function (next) {
  if (this.isModified('progress')) {
    console.log('Progress modified:', {
      before: this.progress,
      after: this.progress
    })
  }
  next()
})

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema) 