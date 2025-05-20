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
    <div className={`bg-white p-4 rounded-lg shadow-sm flex flex-col h-full ${!isAvailable ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium">{block.title}</div>
          <div className="text-sm text-gray-500">{block.level}</div>
        </div>
        {completedBlock && (
          <div className="text-right">
            <div className="text-lg font-bold">{completedBlock.score}/10</div>
            <div className="text-sm text-gray-500">
              {new Date(completedBlock.completedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {isAvailable ? (
        <Link
          to={`/block/${block.id}`}
          className="block w-full text-center bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 hover:text-white mt-auto"
        >
          {completedBlock ? 'Повторити' : 'Почати'}
        </Link>
      ) : (
        <div className="text-center text-gray-500 py-2 mt-auto">
          Спочатку завершіть попередній блок
        </div>
      )}
    </div>
  )
} 