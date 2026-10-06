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
  tip?: BlockTip
}

export interface BlockTip {
  title: string
  /** plain text, `\n` line breaks, `**bold**` only */
  body: string
}

export type ResourceType = 'book' | 'podcast' | 'youtube' | 'app' | 'website' | 'series'

export interface Resource {
  id: string
  level: Level | 'C2' | 'all'
  type: ResourceType
  title: string
  author?: string
  description: string
  url: string
  order: number
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
  dailyGoal?: number
}
