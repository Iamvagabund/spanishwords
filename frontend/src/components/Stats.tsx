import { useStore } from '../store/useStore'

export default function Stats() {
  const { userProgress } = useStore()

  const totalScore = userProgress.completedBlocks.reduce((sum, block) => sum + block.score, 0)

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Статистика</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300">
            Завершено блоків: {userProgress.completedBlocks.length}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Середній бал: {userProgress.averageScore}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Сума балів: {totalScore}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Помилок: {Object.keys(userProgress.mistakes).length}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Поточний рівень: {userProgress.currentLevel}
          </p>
        </div>
      </div>
    </div>
  )
} 