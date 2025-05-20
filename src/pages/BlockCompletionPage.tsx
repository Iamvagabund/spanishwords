import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getBlockTitle } from './BlockPage'

export function BlockCompletionPage() {
  const { blockId } = useParams()
  const navigate = useNavigate()
  const { blocks: storeBlocks, userProgress } = useStore()
  
  const block = storeBlocks.find(b => b.id === Number(blockId))
  if (!block) {
    return <div className="text-red-500">Блок не знайдено</div>
  }

  const completedBlock = userProgress.completedBlocks.find(b => b.id === block.id)
  if (!completedBlock) {
    return <div className="text-red-500">Блок ще не завершено</div>
  }

  const percentage = (completedBlock.score / 10) * 100
  const currentBlockIndex = storeBlocks.findIndex(b => b.id === block.id)
  const hasNextBlock = currentBlockIndex < storeBlocks.length - 1

  console.log('Completion Debug:', {
    currentBlockIndex,
    blocksLength: storeBlocks.length,
    hasNextBlock,
    storeBlocks,
    currentBlockId: block.id,
    percentage,
    completedBlock
  })

  const handleNextBlock = () => {
    if (hasNextBlock) {
      const nextBlock = storeBlocks[currentBlockIndex + 1]
      console.log('Navigating to next block:', nextBlock)
      navigate(`/block/${nextBlock.id}`)
    } else {
      navigate('/')
    }
  }

  const blockTitle = getBlockTitle(block.title)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4">
          <div>{percentage >= 70 ? 'Відмінно!' : 'Потрібно ще попрацювати'}</div>
          <div className="text-sm text-gray-500">{percentage >= 70 ? '¡Excelente!' : 'Necesitas practicar más'}</div>
        </h2>
        <p className="text-lg mb-4">Бал: {completedBlock.score}/10 ({percentage.toFixed(1)}%)</p>
        <p className="text-sm text-gray-500">Puntuación: {completedBlock.score}/10 ({percentage.toFixed(1)}%)</p>
        
        {percentage >= 70 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="font-medium">Блок завершено: {blockTitle.uk}</div>
            <div className="text-sm text-gray-500">Bloque completado: {blockTitle.es}</div>
          </div>
        )}

        <div className="mt-6">
          {percentage >= 70 ? (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <div>На головну</div>
                <div className="text-sm">Volver al inicio</div>
              </button>
              {hasNextBlock && (
                <button
                  onClick={handleNextBlock}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <div>Наступний блок</div>
                  <div className="text-sm">Siguiente bloque</div>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate(`/block/${block.id}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <div>Спробувати ще раз</div>
              <div className="text-sm">Intentar de nuevo</div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 