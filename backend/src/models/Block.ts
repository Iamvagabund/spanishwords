import mongoose from 'mongoose'

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

export interface IWord {
  _id: mongoose.Types.ObjectId
  term: string
  translation: string
  example?: string
  exampleTranslation?: string
}

export interface IBlock extends mongoose.Document {
  language: string
  order: number
  title: string
  titleTarget: string
  description: string
  level: string
  words: IWord[]
  tip?: { title: string; body: string }
}

const wordSchema = new mongoose.Schema({
  term: { type: String, required: true, trim: true, maxlength: 200 },
  translation: { type: String, required: true, trim: true, maxlength: 300 },
  example: { type: String, trim: true, maxlength: 1000 },
  exampleTranslation: { type: String, trim: true, maxlength: 1000 },
})

const blockSchema = new mongoose.Schema(
  {
    language: { type: String, required: true, index: true, lowercase: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    titleTarget: { type: String, default: '', trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    level: { type: String, enum: LEVELS, default: 'A1' },
    words: { type: [wordSchema], default: [] },
    tip: {
      type: new mongoose.Schema(
        {
          title: { type: String, required: true, trim: true, maxlength: 80 },
          body: { type: String, required: true, trim: true, maxlength: 1500 },
        },
        { _id: false }
      ),
      required: false,
    },
  },
  { timestamps: true }
)

blockSchema.index({ language: 1, order: 1 }, { unique: true })

export const Block = mongoose.model<IBlock>('Block', blockSchema)

export const serializeBlock = (b: any) => ({
  id: String(b._id),
  order: b.order,
  title: b.title,
  titleTarget: b.titleTarget ?? '',
  description: b.description ?? '',
  level: b.level,
  ...(b.tip && b.tip.title ? { tip: { title: b.tip.title, body: b.tip.body ?? '' } } : {}),
  words: (b.words || []).map((w: any) => ({
    id: String(w._id),
    term: w.term,
    translation: w.translation,
    ...(w.example ? { example: w.example } : {}),
    ...(w.exampleTranslation ? { exampleTranslation: w.exampleTranslation } : {}),
  })),
})
