import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { login as loginApi } from '../services/authApi'
import { useStore } from './useStore'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  setUser: (user: User | null) => void
}

const API_URL = 'http://localhost:5000/api'

const handleApiError = (error: unknown): string => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Сервер недоступний. Перевірте, чи запущений бекенд.'
  }
  return 'Сталася помилка. Спробуйте ще раз.'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await loginApi(email, password)
          
          if (!response || !response.token) {
            throw new Error('Invalid response from server')
          }

          const { user, token } = response
          
          console.log('Login called with token:', token)
          console.log('Token type:', typeof token)
          console.log('Token length:', token.length)

          set({ 
            user: { ...user, role: 'user' }, 
            token, 
            isAuthenticated: true,
            isLoading: false,
            error: null 
          })
          
          // Оновлюємо прогрес для нового користувача
          if (user?.id) {
            useStore.getState().updateUserProgress(user.id)
          }
        } catch (error) {
          console.error('Login failed:', error)
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Помилка входу'
          })
          throw error
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Помилка реєстрації' }))
            throw new Error(error.message || 'Помилка реєстрації')
          }

          const data = await response.json()
          set({
            user: { ...data.user, role: 'user' },
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          console.error('Registration error:', error)
          set({ 
            error: handleApiError(error), 
            isLoading: false 
          })
          throw error
        }
      },

      logout: () => {
        console.log('Logout called')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        })
        // Скидаємо прогрес при виході
        useStore.getState().resetProgress()
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
          return
        }

        try {
          const response = await fetch(`${API_URL}/user/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error('Помилка перевірки авторизації')
          }

          const user = await response.json()
          set({
            user: { ...user, role: 'user' },
            token,
            isAuthenticated: true,
            error: null,
          })
        } catch (error) {
          console.error('Auth check error:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: handleApiError(error),
          })
        }
      },

      updateProfile: async (data) => {
        const token = get().token
        if (!token) {
          throw new Error('No token found')
        }

        try {
          const response = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update profile')
          }

          const updatedUser = await response.json()
          set({ user: { ...updatedUser, role: 'user' } })
        } catch (error) {
          console.error('Error updating profile:', error)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
) 