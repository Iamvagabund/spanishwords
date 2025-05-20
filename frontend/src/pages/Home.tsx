import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlockProgress } from '../components/BlockProgress'
import { fetchBlocks } from '../services/api'
import { useStore } from '../store/useStore'

export function Home() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userProgress } = useStore()

  const totalScore = userProgress?.completedBlocks?.reduce((sum, block) => sum + (block.score || 0), 0) || 0

  useEffect(() => {
    async function loadBlocks() {
      try {
        const response = await fetchBlocks()
        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          setBlocks(response.data)
        }
      } catch {
        setError('Помилка завантаження блоків')
      } finally {
        setLoading(false)
      }
    }

    loadBlocks()
  }, [])

  if (loading) {
    return <div>Завантаження...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ваша статистика</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Завершено блоків</p>
            <p className="text-2xl font-bold">{userProgress?.completedBlocks?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Середній бал</p>
            <p className="text-2xl font-bold">{userProgress?.averageScore || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Сума балів</p>
            <p className="text-2xl font-bold">{totalScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Поточний рівень</p>
            <p className="text-2xl font-bold">{userProgress?.currentLevel || 1}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map((block, index) => (
          <BlockProgress key={`block-progress-${block.id}-${index}`} block={block} />
        ))}
      </div>
    </div>
  )
} 