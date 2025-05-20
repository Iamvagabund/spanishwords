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
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-gray-800">
            <div>Іспанські слова</div>
            <div className="text-sm text-gray-500">Palabras en español</div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div>Головна</div>
              <div className="text-xs">Inicio</div>
            </Link>
            <Link 
              to="/review" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/review') 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div>Повторення</div>
              <div className="text-xs">Repaso</div>
            </Link>
            <Link 
              to="/stats" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/stats') 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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