import { StatsDisplay } from '../components/Stats'

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ваша статистика</h2>
          <StatsDisplay />
        </div>
        {/* ... інший код ... */}
      </div>
    </div>
  )
} 