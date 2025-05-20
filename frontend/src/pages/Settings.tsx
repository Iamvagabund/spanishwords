import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'

export function Settings() {
  const { resetProgress, resetStats, resetMistakes } = useStore()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    console.log('Settings component mounted, theme:', theme)
  }, [theme])

  const handleLogout = () => {
    logout()
    toast.success('Ви успішно вийшли з акаунту')
  }

  const handleThemeToggle = () => {
    console.log('Settings: Theme toggle clicked, current theme:', theme)
    toggleTheme()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Налаштування</h1>
      
      <div className="space-y-6">
        {/* Налаштування теми */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Темна тема</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Увімкнути темну тему</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-primary' : 'bg-gray-200'
              }`}
              onClick={handleThemeToggle}
            >
              <span className="sr-only">Увімкнути темну тему</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Налаштування прогресу */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Прогрес</h2>
          <div className="space-y-4">
            <button
              onClick={resetProgress}
              className="btn-primary w-full"
            >
              Скинути весь прогрес
            </button>
            <button
              onClick={resetStats}
              className="btn-secondary w-full"
            >
              Скинути статистику
            </button>
            <button
              onClick={resetMistakes}
              className="btn-secondary w-full"
            >
              Скинути помилки
            </button>
          </div>
        </div>

        {/* Налаштування акаунту */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Акаунт</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Поточний користувач:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary w-full"
            >
              Вийти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 