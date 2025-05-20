import { useAuthStore } from '../store/authStore'
import { toast } from 'react-hot-toast'

export function Settings() {
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Ви успішно вийшли з акаунту')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <button
        onClick={handleLogout}
        className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-red-600 transition-colors"
          >
        Вийти з акаунту
          </button>
        </div>
  )
} 