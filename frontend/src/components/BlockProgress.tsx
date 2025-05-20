import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Block } from '../data/blocks'

interface BlockProgressProps {
  block: Block
}

export function BlockProgress({ block }: BlockProgressProps) {
  const { userProgress } = useStore()
  const completedBlock = userProgress.completedBlocks.find(b => b.id === block.id)
  const isAvailable = block.id === 1 || userProgress.completedBlocks.some(b => b.id === block.id - 1)

  return (
    <div className={`bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm flex flex-col h-full ${!isAvailable ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium text-gray-900 dark:text-dark-text">{block.title}</div>
          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{block.level}</div>
        </div>
        {completedBlock && (
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-dark-text">{completedBlock.score}/10</div>
            <div className="text-sm text-gray-500 dark:text-dark-text-secondary">
              {new Date(completedBlock.completedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {isAvailable ? (
        <Link
          to={`/block/${block.id}`}
          className="block w-full text-center bg-blue-500 dark:bg-dark-accent text-white py-2 rounded-md hover:bg-blue-600 dark:hover:bg-dark-accent-hover hover:text-white mt-auto"
        >
          {completedBlock ? 'Повторити' : 'Почати'}
        </Link>
      ) : (
        <div className="text-center text-gray-500 dark:text-dark-text-secondary py-2 mt-auto">
          Спочатку завершіть попередній блок
        </div>
      )}
    </div>
  )
} 