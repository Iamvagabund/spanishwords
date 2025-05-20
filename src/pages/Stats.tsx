import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function Stats() {
  const { userProgress } = useStore()

  const totalScore = userProgress.completedBlocks.reduce((sum, block) => sum + block.score, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Статистика</h1>
      <p className="text-lg mb-4">Відстежуйте свій прогрес</p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">Ваша статистика</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Загальна статистика</h2>
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
              Помилок: {userProgress.mistakes.length}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Поточний рівень: {userProgress.currentLevel}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Останні результати</h2>
            {userProgress.completedBlocks.slice(-5).map((block, index) => (
              <div key={`block-${block.id}-${index}`} className="mb-2">
                <p className="text-gray-600 dark:text-gray-300">
                  Блок {block.id} - {block.score} балів
                </p>
              </div>
            ))}
          </div>
        </div>

        {userProgress.mistakes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-2xl font-bold mb-4">Слова з помилками</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProgress.mistakes.map((word, index) => (
                <div
                  key={`mistake-${word.id}-${index}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold">{word.spanish}</p>
                  <p className="text-gray-600">{word.ukrainian}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 