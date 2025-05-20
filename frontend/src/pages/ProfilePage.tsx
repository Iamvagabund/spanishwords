import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useStore } from '../store/useStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Stats } from '../components/Stats'

export function ProfilePage() {
  const { user, updateProfile, logout, token } = useAuthStore()
  const { userProgress } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Оновлюємо nickname при зміні user
  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname)
    }
  }, [user])

  if (!user) {
    return null
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('Нікнейм не може бути порожнім')
      return
    }
    try {
      setIsLoading(true)
      await updateProfile({ nickname: nickname.trim() })
      setIsEditing(false)
      toast.success('Нікнейм оновлено')
    } catch (error) {
      toast.error('Помилка оновлення ніку')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Розмір файлу не може перевищувати 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, виберіть зображення')
      return
    }
    try {
      setIsLoading(true)
      
      // Зменшуємо розмір зображення
      const img = new Image()
      img.src = URL.createObjectURL(file)
      
      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 200
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7)
          resolve(resizedBase64)
        }
      }).then(async (resizedBase64) => {
        const response = await fetch('http://localhost:5000/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: resizedBase64 })
        })

        if (!response.ok) {
          throw new Error('Failed to update avatar')
        }

        const updatedUser = await response.json()
        await updateProfile(updatedUser)
        toast.success('Аватарку оновлено')
        window.location.reload()
      })
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error('Помилка завантаження аватарки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Ви успішно вийшли з акаунту')
    navigate('/auth')
  }

  const handleResetProgress = async () => {
    if (!window.confirm('Ви впевнені, що хочете скинути свої досягнення? Цю дію неможливо скасувати.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/user/reset-progress', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reset progress')
      }

      const updatedUser = await response.json()
      await updateProfile(updatedUser)
      toast.success('Ваші досягнення скинуто')
      
      // Очищаємо локальне сховище
      localStorage.removeItem('user-progress')
      
      // Перезавантажуємо сторінку
      window.location.reload()
    } catch (error) {
      console.error('Error resetting progress:', error)
      toast.error('Помилка скидання досягнень')
    } finally {
      setIsLoading(false)
    }
  }

  // Рахуємо статистику тільки для досягнень
  const totalWords = userProgress?.learnedWords?.length || 0
  const currentStreak = userProgress?.completedBlocks?.length > 0 
    ? Math.floor((new Date().getTime() - new Date(userProgress.completedBlocks[userProgress.completedBlocks.length - 1].completedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Перевіряємо досягнення
  const hasFirstWord = totalWords > 0
  const hasSevenDaysStreak = currentStreak >= 7

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
              alt="Аватар"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <button 
              onClick={handleAvatarClick}
              disabled={isLoading}
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Введіть нікнейм"
                />
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Скасувати
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.nickname || 'Встановіть нікнейм'}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
            <Stats />
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Налаштування</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Темна тема</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="sr-only">Увімкнути темну тему</span>
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Сповіщення</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="sr-only">Увімкнути сповіщення</span>
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Досягнення</h2>
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 ${hasFirstWord ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full ${hasFirstWord ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {hasFirstWord && (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Перше слово</p>
                  <p className="text-xs text-gray-500">Вивчіть своє перше слово</p>
                </div>
              </div>
              <div className={`flex items-center space-x-3 ${hasSevenDaysStreak ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full ${hasSevenDaysStreak ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {hasSevenDaysStreak && (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">7 днів поспіль</p>
                  <p className="text-xs text-gray-500">Тренуйтесь 7 днів поспіль</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-4">
          <button
            onClick={handleResetProgress}
            disabled={isLoading}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-yellow-600 transition-colors"
          >
            Скинути свої досягнення
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-red-600 transition-colors"
          >
            Вийти з акаунту
          </button>
        </div>
      </div>
    </div>
  )
} 