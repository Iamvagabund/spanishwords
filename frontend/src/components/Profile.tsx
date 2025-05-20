import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function Profile() {
  const { user } = useAuthStore()

  return (
    <Link
      to="/profile"
      className="flex items-center space-x-2 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
    >
      <div className="relative">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.email}&background=random`}
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
        />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      </div>
      {user?.nickname && (
        <span className="text-sm font-medium text-gray-700">{user.nickname}</span>
      )}
    </Link>
  )
} 