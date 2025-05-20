import type { UserProgress } from '../store/useStore'

const STORAGE_KEY = 'spanish_words_progress'

export function saveProgress(progress: UserProgress): void {
  try {
    // Конвертуємо дати в рядки для збереження
    const serializedProgress = {
      ...progress,
      repetitionProgress: Object.entries(progress.repetitionProgress).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          nextReview: value.nextReview.toISOString()
        }
      }), {})
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
      repetitionProgress: Object.entries(parsedProgress.repetitionProgress).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          nextReview: new Date(value.nextReview)
        }
      }), {})
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