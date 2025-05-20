import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { words } from '../data/words'
import { blocks } from '../data/blocks'
import type { Word, CompletedBlock, RepetitionProgress } from '../types'
import { useAuthStore } from './authStore'

export interface UserProgress {
  currentLevel: number
  completedBlocks: CompletedBlock[]
  mistakes: Record<string, number>
  averageScore: number
  currentBlock: string
  learnedWords: string[]
  repetitionProgress: Record<number, RepetitionProgress>
}

interface Store {
  blocks: typeof blocks
  currentBlock: number
  words: typeof words
  userProgress: UserProgress
  setCurrentBlock: (blockId: number) => void
  completeBlock: (blockId: number, score: number) => void
  updateRepetitionProgress: (wordId: number, progress: RepetitionProgress) => void
  setLevel: (level: number) => void
  resetProgress: () => void
  resetStats: () => void
  resetMistakes: () => void
  addMistake: (word: Word) => void
  removeMistake: (wordId: number) => void
  updateUserProgress: (userId: string) => void
}

const initialProgress: UserProgress = {
  currentLevel: 1,
  completedBlocks: [],
  mistakes: {},
  averageScore: 0,
  currentBlock: 'block1',
  learnedWords: [],
  repetitionProgress: {}
}

// Функція для збереження прогресу користувача
const saveUserProgress = (userId: string, progress: UserProgress) => {
  localStorage.setItem(`user-progress-${userId}`, JSON.stringify(progress))
}

// Функція для завантаження прогресу користувача
const loadUserProgress = (userId: string): UserProgress | null => {
  const savedProgress = localStorage.getItem(`user-progress-${userId}`)
  if (savedProgress) {
    try {
      return JSON.parse(savedProgress)
    } catch (e) {
      console.error('Failed to parse saved progress:', e)
    }
  }
  return null
}

// Створюємо стор з унікальним ключем для кожного користувача
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      blocks,
      currentBlock: 1,
      words,
      userProgress: initialProgress,
      setCurrentBlock: (blockId) => set({ currentBlock: blockId }),
      completeBlock: (blockId, score) =>
        set((state) => {
          const block = state.blocks.find(b => b.id === blockId)
          if (!block) return state

          // Отримуємо слова, які користувач правильно відповів
          const correctWords = block.words.filter(wordId => {
            const word = state.words.find(w => w.id === wordId)
            return word && !state.userProgress.mistakes[wordId]
          }).map(wordId => {
            const word = state.words.find(w => w.id === wordId)
            return word?.spanish || ''
          }).filter(Boolean)
          
          // Додаємо нові слова до списку вивчених
          const newLearnedWords = [...new Set([...state.userProgress.learnedWords, ...correctWords])]

          // Оновлюємо список завершених блоків
          const newCompletedBlocks = [
            ...state.userProgress.completedBlocks,
            {
              id: blockId,
              score: score || 0,
              completedAt: new Date().toISOString()
            }
          ]

          // Рахуємо середній бал
          const totalScore = newCompletedBlocks.reduce((sum, block) => sum + (block.score || 0), 0)
          const averageScore = totalScore / newCompletedBlocks.length

          // Визначаємо рівень на основі кількості завершених блоків
          let currentLevel = 1
          if (newCompletedBlocks.length >= 10) {
            currentLevel = 4
          } else if (newCompletedBlocks.length >= 7) {
            currentLevel = 3
          } else if (newCompletedBlocks.length >= 4) {
            currentLevel = 2
          }

          // Оновлюємо прогрес
          const newProgress = {
            ...state.userProgress,
            completedBlocks: newCompletedBlocks,
            learnedWords: newLearnedWords,
            averageScore,
            currentLevel,
            mistakes: state.userProgress.mistakes || {},
            repetitionProgress: state.userProgress.repetitionProgress || {}
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            ...state,
            userProgress: newProgress
          }
        }),
      updateRepetitionProgress: (wordId, progress) =>
        set((state) => {
          const newProgress = {
            ...state.userProgress,
            repetitionProgress: {
              ...state.userProgress.repetitionProgress,
              [wordId]: progress
            }
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      setLevel: (level) =>
        set((state) => {
          const newProgress = {
            ...state.userProgress,
            currentLevel: level
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      resetProgress: () =>
        set((state) => {
          const newProgress = {
            ...initialProgress,
            currentLevel: 1,
            averageScore: 0
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress,
            currentBlock: 1
          }
        }),
      resetStats: () =>
        set((state) => {
          const newProgress = {
            ...state.userProgress,
            completedBlocks: [],
            averageScore: 0,
            mistakes: {}
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      resetMistakes: () =>
        set((state) => {
          const newProgress = {
            ...state.userProgress,
            mistakes: {}
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      addMistake: (word) =>
        set((state) => {
          const newMistakes = { ...state.userProgress.mistakes }
          newMistakes[word.id] = word.id
          const newProgress = {
            ...state.userProgress,
            mistakes: newMistakes
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      removeMistake: (wordId) =>
        set((state) => {
          const newMistakes = { ...state.userProgress.mistakes }
          delete newMistakes[wordId]
          const newProgress = {
            ...state.userProgress,
            mistakes: newMistakes
          }

          // Зберігаємо прогрес для поточного користувача
          const userId = useAuthStore.getState().user?.id
          if (userId) {
            saveUserProgress(userId, newProgress)
          }

          return {
            userProgress: newProgress
          }
        }),
      updateUserProgress: (userId) =>
        set((state) => {
          // Завантажуємо прогрес для нового користувача
          const savedProgress = loadUserProgress(userId)
          if (savedProgress) {
            return {
              ...state,
              userProgress: savedProgress
            }
          }
          // Якщо немає збереженого прогресу, скидаємо до початкового стану
          return {
            ...state,
            userProgress: initialProgress
          }
        })
    }),
    {
      name: 'user-progress',
      partialize: (state) => ({
        userProgress: state.userProgress
      })
    }
  )
) 