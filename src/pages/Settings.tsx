import { useStore } from '../store/useStore'
import { Container } from '../components/Container'
import { toast } from 'react-hot-toast'

export function Settings() {
  const { resetStats } = useStore()

  const handleReset = () => {
    if (window.confirm('Ви впевнені, що хочете скинути всю статистику? Цю дію неможливо скасувати.')) {
      resetStats()
      toast.success('Статистику скинуто')
    }
  }

  return (
    <Container>
      <h1 className="text-3xl font-bold mb-6">
        <div>Налаштування</div>
        <div className="text-sm text-gray-500">Configuración</div>
      </h1>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          <div>Скидання статистики</div>
          <div className="text-sm text-gray-500">Restablecer estadísticas</div>
        </h2>

        <div className="mb-6">
          <h3 className="font-medium mb-2">
            <div>Скинути статистику</div>
            <div className="text-sm text-gray-500">Restablecer estadísticas</div>
          </h3>
          <div className="text-gray-600 dark:text-gray-300 mb-4">
            <div>Видалити історію завершених блоків та середній бал</div>
            <div className="text-sm text-gray-500">Eliminar el historial de bloques completados y la nota media</div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <div>Скинути</div>
            <div className="text-sm">Restablecer</div>
          </button>
        </div>
      </div>
    </Container>
  )
} 