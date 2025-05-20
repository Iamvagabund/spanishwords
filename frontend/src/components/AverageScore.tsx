import { useStore } from '../store/useStore'

interface AverageScoreProps {
  variant?: 'default' | 'large'
}

export function AverageScore({ variant = 'default' }: AverageScoreProps) {
  const { userProgress } = useStore()
  const completedBlocks = userProgress?.completedBlocks?.length || 0
  const totalScore = userProgress?.completedBlocks?.reduce((sum, block) => sum + (block.score || 0), 0) || 0
  const averageScore = completedBlocks > 0 ? (totalScore / completedBlocks).toFixed(1) : '0'

  if (variant === 'large') {
    return (
      <div>
        <p className="text-sm text-gray-500">Середній бал</p>
        <p className="text-2xl font-bold">{averageScore}</p>
      </div>
    )
  }

  return (
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Середній бал</span>
      <span>{averageScore}</span>
    </div>
  )
} 