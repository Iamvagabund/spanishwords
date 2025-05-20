import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login logic
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-dark-card rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-dark-text">Вхід</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark-input dark:border-dark-border dark:text-dark-text"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark-input dark:border-dark-border dark:text-dark-text"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
        >
          Увійти
        </button>
      </form>
    </div>
  )
} 