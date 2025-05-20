import type { UserProgress } from '../store/useStore'
import type { RepetitionProgress } from '../types'

const STORAGE_KEY = 'spanish_words_progress'

interface RepetitionProgressItem {
  nextReview: string
  interval: number
  easeFactor: number
  repetitions: number
}

export function saveProgress(progress: UserProgress): void {
  try {
    // Конвертуємо дати в рядки для збереження
    const serializedProgress = {
      ...progress,
      repetitionProgress: Object.entries(progress.repetitionProgress).reduce<Record<string, RepetitionProgressItem>>((acc, [key, value]) => {
        const progress = value as RepetitionProgress
        return {
          ...acc,
          [key]: {
            nextReview: progress.nextReview.toISOString(),
            interval: progress.interval,
            easeFactor: progress.easeFactor,
            repetitions: progress.repetitions
          }
        }
      }, {})
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedProgress))
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

export function loadProgress(): UserProgress | null {
  try {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (!savedProgress) return null

    const parsedProgress = JSON.parse(savedProgress)
    
    // Конвертуємо рядки дат назад в об'єкти Date
    return {
      ...parsedProgress,
      repetitionProgress: Object.entries(parsedProgress.repetitionProgress).reduce<Record<string, RepetitionProgress>>((acc, [key, value]) => {
        const item = value as RepetitionProgressItem
        return {
          ...acc,
          [key]: {
            wordId: parseInt(key),
            nextReview: new Date(item.nextReview),
            interval: item.interval,
            easeFactor: item.easeFactor,
            repetitions: item.repetitions
          }
        }
      }, {})
    }
  } catch (error) {
    console.error('Failed to load progress:', error)
    return null
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear progress:', error)
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const serializedValue = localStorage.getItem(key)
    if (serializedValue === null) {
      return null
    }
    return JSON.parse(serializedValue) as T
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return null
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

export function clear(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

export function getAllItems(): Record<string, unknown> {
  try {
    const items: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            items[key] = JSON.parse(value)
          } catch {
            items[key] = value
          }
        }
      }
    }
    return items
  } catch (error) {
    console.error('Error getting all items from localStorage:', error)
    return {}
  }
} 