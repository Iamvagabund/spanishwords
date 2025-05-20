import { useStore } from '../store/useStore'
import { AverageScore } from './AverageScore'

// Компонент для особистого кабінету
export function Stats() {
  const { userProgress } = useStore()

  // Рахуємо статистику
  const totalWords = userProgress?.learnedWords?.length || 0
  const completedBlocks = userProgress?.completedBlocks?.length || 0
  const totalScore = userProgress?.completedBlocks?.reduce((sum, block) => sum + (block.score || 0), 0) || 0
  const currentLevel = userProgress?.currentLevel || 1
  const mistakesCount = userProgress?.mistakes ? Object.keys(userProgress.mistakes).length : 0

  console.log('Stats component:', {
    totalWords,
    completedBlocks,
    totalScore,
    currentLevel,
    mistakesCount,
    userProgress
  })

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Завершено блоків</span>
          <span>{completedBlocks}</span>
        </div>
      </div>
      <div>
        <AverageScore />
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Сума балів</span>
          <span>{totalScore}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Помилок</span>
          <span>{mistakesCount}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Поточний рівень</span>
          <span>{currentLevel}</span>
        </div>
      </div>
    </div>
  )
}

// Компонент для інших сторінок
export function StatsDisplay() {
  const { userProgress } = useStore()

  // Рахуємо статистику
  const totalWords = userProgress?.learnedWords?.length || 0
  const completedBlocks = userProgress?.completedBlocks?.length || 0
  const totalScore = userProgress?.completedBlocks?.reduce((sum, block) => sum + (block.score || 0), 0) || 0
  const currentLevel = userProgress?.currentLevel || 1
  const mistakesCount = userProgress?.mistakes ? Object.keys(userProgress.mistakes).length : 0

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Завершено блоків</span>
          <span>{completedBlocks}</span>
        </div>
      </div>
      <div>
        <AverageScore />
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Сума балів</span>
          <span>{totalScore}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Помилок</span>
          <span>{mistakesCount}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Поточний рівень</span>
          <span>{currentLevel}</span>
        </div>
      </div>
    </div>
  )
} 