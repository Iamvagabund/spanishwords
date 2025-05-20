import { blocks } from '../data/blocks'
import type { Word } from '../types/word'
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

export async function fetchBlocks(): Promise<ApiResponse<Block[]>> {
  try {
    const response = await fetch('/api/blocks')
    if (!response.ok) {
      throw new Error('Failed to fetch blocks')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function fetchBlock(id: number): Promise<ApiResponse<Block>> {
  try {
    const response = await fetch(`/api/blocks/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch block')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
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

export async function fetchStats(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/stats')
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const getNextLevel = (currentLevel: string): string => {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
  const currentIndex = levels.indexOf(currentLevel)
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel
}

export async function fetchWords(): Promise<ApiResponse<Word[]>> {
  try {
    const response = await fetch('/api/words')
    if (!response.ok) {
      throw new Error('Failed to fetch words')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function login(email: string, password: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error('Failed to login')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function register(email: string, password: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error('Failed to register')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function completeBlock(blockId: number, score: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/blocks/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blockId, score }),
    })
    if (!response.ok) {
      throw new Error('Failed to complete block')
    }
    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 