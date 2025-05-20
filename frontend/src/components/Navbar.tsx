import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Profile } from './Profile'

export function Navbar() {
  const { user } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-gray-800 dark:text-dark-text">
            <div>Іспанські слова</div>
            <div className="text-sm text-gray-500 dark:text-dark-text-secondary">Palabras en español</div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'bg-blue-500 text-white dark:bg-dark-accent dark:text-white' 
                  : 'text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card-hover'
              }`}
            >
              <div>Головна</div>
              <div className="text-xs">Inicio</div>
            </Link>
            <Link 
              to="/review" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/review') 
                  ? 'bg-blue-500 text-white dark:bg-dark-accent dark:text-white' 
                  : 'text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card-hover'
              }`}
            >
              <div>Повторення</div>
              <div className="text-xs">Repaso</div>
            </Link>
            <Link 
              to="/stats" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/stats') 
                  ? 'bg-blue-500 text-white dark:bg-dark-accent dark:text-white' 
                  : 'text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card-hover'
              }`}
            >
              <div>Статистика</div>
              <div className="text-xs">Estadísticas</div>
            </Link>

            {user ? (
              <Profile />
            ) : (
              <Link 
                to="/auth"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Увійти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 