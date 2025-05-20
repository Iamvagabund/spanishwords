import { blocks } from '../data/blocks'
import type { Word } from '../types'
import { useStore } from '../store/useStore'
import type { Block } from '../data/blocks'
import { words } from '../data/words'

interface Answer {
  wordId: number
  answer: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

export async function fetchBlocks(): Promise<ApiResponse<typeof blocks>> {
  try {
    return { data: blocks }
  } catch (error) {
    return { error: 'Failed to fetch blocks' }
  }
}

export async function fetchBlock(blockId: number): Promise<ApiResponse<typeof blocks[0]>> {
  try {
    const block = blocks.find(b => b.id === blockId)
    if (!block) {
      return { error: 'Block not found' }
    }
    return { data: block }
  } catch (error) {
    return { error: 'Failed to fetch block' }
  }
}

export async function submitAnswers(blockId: number, answers: Answer[]): Promise<ApiResponse<{ score: number }>> {
  try {
    const block = blocks.find(b => b.id === blockId)
    if (!block) {
      return { data: { score: 0 }, error: 'Block not found' }
    }

    let correctAnswers = 0
    const mistakes: Word[] = []

    answers.forEach(answer => {
      const word = words.find(w => w.id === answer.wordId)
      if (word) {
        if (answer.answer.toLowerCase() === word.spanish.toLowerCase()) {
          correctAnswers++
        } else {
          mistakes.push(word)
        }
      }
    })

    const score = Math.round((correctAnswers / block.words.length) * 10)
    
    // Update progress
    const store = useStore.getState()
    store.completeBlock(blockId, score)
    mistakes.forEach(word => store.addMistake(word))

    return { data: { score } }
  } catch {
    return { data: { score: 0 }, error: 'Failed to submit answers' }
  }
}

export async function fetchControlTest(level: string): Promise<ApiResponse<Word[]>> {
  try {
    const levelBlocks = blocks.filter(b => b.level === level)
    const wordIds = levelBlocks.flatMap(b => b.words)
    const levelWords = wordIds.map(id => words.find(w => w.id === id)).filter((w): w is Word => w !== undefined)
    return { data: levelWords }
  } catch {
    return { data: [], error: 'Failed to fetch control test' }
  }
}

export async function submitControlTest(level: string, answers: Answer[]): Promise<ApiResponse<{ score: number }>> {
  try {
    const levelBlocks = blocks.filter(b => b.level === level)
    const wordIds = levelBlocks.flatMap(b => b.words)
    const levelWords = wordIds.map(id => words.find(w => w.id === id)).filter((w): w is Word => w !== undefined)
    
    let correctAnswers = 0
    const mistakes: Word[] = []

    answers.forEach(answer => {
      const word = levelWords.find(w => w.id === answer.wordId)
      if (word) {
        if (answer.answer.toLowerCase() === word.spanish.toLowerCase()) {
          correctAnswers++
        } else {
          mistakes.push(word)
        }
      }
    })

    const score = Math.round((correctAnswers / levelWords.length) * 10)
    
    // Update progress
    const store = useStore.getState()
    if (score >= 7) { // Якщо оцінка 7 або вище, можна перейти на наступний рівень
      const nextLevel = getNextLevel(level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1')
      if (nextLevel) {
        store.setLevel(nextLevel)
      }
    }
    mistakes.forEach(word => store.addMistake(word))

    return { data: { score } }
  } catch {
    return { data: { score: 0 }, error: 'Failed to submit control test' }
  }
}

export async function fetchStats(): Promise<ApiResponse<{
  completedBlocks: number
  currentLevel: string
  averageScore: number
  mistakes: Word[]
}>> {
  try {
    const store = useStore.getState()
    const completedBlocks = store.userProgress.completedBlocks.length
    const currentLevel = store.userProgress.currentLevel
    const averageScore = store.userProgress.averageScore
    const mistakes = store.userProgress.mistakes

    return {
      data: {
        completedBlocks,
        currentLevel,
        averageScore,
        mistakes
      }
    }
  } catch (error) {
    return { error: 'Failed to fetch stats' }
  }
}

export function getNextLevel(currentLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  const levels: ('A1' | 'A2' | 'B1' | 'B2' | 'C1')[] = ['A1', 'A2', 'B1', 'B2', 'C1']
  const currentIndex = levels.indexOf(currentLevel)
  return levels[Math.min(currentIndex + 1, levels.length - 1)]
} 