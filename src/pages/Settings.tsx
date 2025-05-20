import { useStore } from '../store/useStore'
import { toast } from 'react-hot-toast'

export function Settings() {
  const { resetStats } = useStore()

  const handleResetStats = () => {
    if (window.confirm('Ви впевнені, що хочете скинути всю статистику? Цю дію неможливо скасувати.')) {
      resetStats()
      toast.success('Статистику скинуто')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Налаштування</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Скидання статистики</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Скинути статистику</div>
            <div className="text-sm text-gray-500">Видалити історію завершених блоків та середній бал</div>
          </div>
          <button
            onClick={handleResetStats}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Скинути
          </button>
        </div>
      </div>
    </div>
  )
} 