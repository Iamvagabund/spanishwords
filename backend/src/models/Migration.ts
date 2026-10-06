import mongoose from 'mongoose'

export interface IMigration extends mongoose.Document {
  id: string
  appliedAt: Date
}

const migrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  appliedAt: { type: Date, default: Date.now },
})

export const Migration = mongoose.model<IMigration>('Migration', migrationSchema)
