import mongoose from 'mongoose'

export interface ILanguage extends mongoose.Document {
  code: string
  name: string
  nativeName: string
  flag: string
  isActive: boolean
}

const languageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z]{2,8}$/ },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    nativeName: { type: String, required: true, trim: true, maxlength: 100 },
    flag: { type: String, default: '', trim: true, maxlength: 20 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Language = mongoose.model<ILanguage>('Language', languageSchema)

export const serializeLanguage = (l: any) => ({
  code: l.code,
  name: l.name,
  nativeName: l.nativeName,
  flag: l.flag,
  isActive: l.isActive,
})
