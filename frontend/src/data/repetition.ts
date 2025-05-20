import type { Word } from './words'

export interface RepetitionProgress {
  wordId: number
  nextReview: Date
  interval: number // в днях
  easeFactor: number // множник для інтервалу
  repetitions: number // кількість успішних повторень
}

// Алгоритм SuperMemo 2
export function calculateNextReview(
  progress: RepetitionProgress | undefined,
  quality: number // 0-5, де 5 - найкраще
): RepetitionProgress {
  if (!progress) {
    return {
      wordId: 0,
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0
    }
  }

  let { interval, easeFactor, repetitions } = progress

  // Оновлюємо ease factor
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  // Оновлюємо інтервал
  if (quality >= 3) {
    repetitions++
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
  } else {
    repetitions = 0
    interval = 1
  }

  // Розраховуємо наступну дату повторення
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    wordId: progress.wordId,
    nextReview,
    interval,
    easeFactor,
    repetitions
  }
}

// Функція для отримання слів, які потрібно повторити
export function getWordsForReview(
  words: Word[],
  progress: Record<number, RepetitionProgress>
): Word[] {
  // Отримуємо всі слова, які ще не були в повторенні
  const newWords = words.filter(word => !progress[word.id])
  
  // Якщо є нові слова, повертаємо перші 5
  if (newWords.length > 0) {
    return newWords.slice(0, 5)
  }

  // Якщо нових слів немає, повертаємо слова, які потрібно повторити
  const now = new Date()
  const wordsToReview = words.filter(word => {
    const wordProgress = progress[word.id]
    return wordProgress && wordProgress.nextReview <= now
  })

  // Якщо слів для повторення немає, повертаємо всі слова
  if (wordsToReview.length === 0) {
    return words.slice(0, 5)
  }

  return wordsToReview.slice(0, 5)
}

// Функція для оцінки якості відповіді
export function evaluateAnswer(
  word: Word,
  answer: string
): number {
  const normalizedAnswer = answer.toLowerCase().trim()
  const normalizedWord = word.spanish.toLowerCase().trim()

  if (normalizedAnswer === normalizedWord) {
    return 5 // Ідеальна відповідь
  } else if (normalizedAnswer.includes(normalizedWord) || normalizedWord.includes(normalizedAnswer)) {
    return 4 // Часткова відповідь
  } else if (normalizedAnswer.length > 0) {
    return 2 // Неправильна відповідь
  }
  return 0 // Немає відповіді
} 