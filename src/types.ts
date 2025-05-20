export interface Word {
  id: number
  spanish: string
  ukrainian: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
}

export interface CompletedBlock {
  id: number
  score: number
  completedAt: string
}

export interface RepetitionProgress {
  wordId: number
  nextReview: Date
  interval: number // в днях
  easeFactor: number // множник для інтервалу
  repetitions: number // кількість успішних повторень
} 