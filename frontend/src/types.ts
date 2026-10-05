export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  blockCount: number
}

export interface Word {
  id: string
  term: string
  translation: string
  example?: string
  exampleTranslation?: string
}

export interface Block {
  id: string
  order: number
  title: string
  titleTarget: string
  description: string
  level: Level
  words: Word[]
}

export interface CompletedBlock {
  blockId: string
  score: number // 1-10
  completedAt: string
}

export interface LangProgress {
  completedBlocks: CompletedBlock[]
  mistakes: Record<string, number>
  learnedWords: string[]
  currentLevel: number
  averageScore: number
}

export type ProgressMap = Record<string, LangProgress>

export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  nickname?: string
  avatar?: string
  selectedLanguage?: string
}
