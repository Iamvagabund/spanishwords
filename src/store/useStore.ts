import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { words } from '../data/words'
import { blocks } from '../data/blocks'
import type { Word, CompletedBlock, RepetitionProgress } from '../types'

interface Store {
  blocks: typeof blocks
  currentBlock: number
  words: typeof words
  userProgress: {
    currentLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
    completedBlocks: CompletedBlock[]
    mistakes: Word[]
    averageScore: number
    repetitionProgress: Record<number, RepetitionProgress>
  }
  setCurrentBlock: (blockId: number) => void
  completeBlock: (blockId: number, score: number) => void
  updateRepetitionProgress: (wordId: number, progress: RepetitionProgress) => void
  setLevel: (level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void
  resetProgress: () => void
  resetStats: () => void
  resetMistakes: () => void
  addMistake: (word: Word) => void
  removeMistake: (wordId: number) => void
}

const initialProgress = {
  currentLevel: 'A1' as const,
  completedBlocks: [],
  mistakes: [] as Word[],
  averageScore: 0,
  repetitionProgress: {}
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      blocks,
      currentBlock: 1,
      words,
      userProgress: initialProgress,
      setCurrentBlock: (blockId) => set({ currentBlock: blockId }),
      completeBlock: (blockId, score) =>
        set((state) => {
          const completedBlock = {
            id: blockId,
            score,
            completedAt: new Date().toISOString()
          }
          
          // Створюємо Map для унікальних блоків
          const blocksMap = new Map(
            state.userProgress.completedBlocks.map(block => [block.id, block])
          )
          
          // Оновлюємо або додаємо новий блок
          blocksMap.set(blockId, completedBlock)
          
          // Конвертуємо Map назад в масив
          const completedBlocks = Array.from(blocksMap.values())
          
          const averageScore =
            completedBlocks.reduce((sum, block) => sum + block.score, 0) / completedBlocks.length

          return {
            userProgress: {
              ...state.userProgress,
              completedBlocks,
              averageScore
            }
          }
        }),
      updateRepetitionProgress: (wordId, progress) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            repetitionProgress: {
              ...state.userProgress.repetitionProgress,
              [wordId]: progress
            }
          }
        })),
      setLevel: (level) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            currentLevel: level
          }
        })),
      resetProgress: () =>
        set((state) => {
          // Очищаємо дублікати, залишаючи тільки останній запис для кожного блоку
          const uniqueBlocks = state.userProgress.completedBlocks.reduce((acc, block) => {
            const existingIndex = acc.findIndex(b => b.id === block.id)
            if (existingIndex === -1) {
              acc.push(block)
            } else {
              // Якщо знайдено дублікат, замінюємо його на новіший
              if (new Date(block.completedAt) > new Date(acc[existingIndex].completedAt)) {
                acc[existingIndex] = block
              }
            }
            return acc
          }, [] as CompletedBlock[])

          return {
            userProgress: {
              ...initialProgress,
              completedBlocks: uniqueBlocks
            },
            currentBlock: 1
          }
        }),
      resetStats: () =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            completedBlocks: [],
            averageScore: 0,
            mistakes: []
          }
        })),
      resetMistakes: () =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            mistakes: []
          }
        })),
      addMistake: (word) =>
        set((state) => {
          // Перевіряємо чи слово вже є в масиві помилок
          const exists = state.userProgress.mistakes.some(w => w.id === word.id)
          if (exists) return state

          return {
            userProgress: {
              ...state.userProgress,
              mistakes: [...state.userProgress.mistakes, word]
            }
          }
        }),
      removeMistake: (wordId) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            mistakes: state.userProgress.mistakes.filter(word => word.id !== wordId)
          }
        }))
    }),
    {
      name: 'user-progress',
      partialize: (state) => ({
        userProgress: state.userProgress
      })
    }
  )
) 