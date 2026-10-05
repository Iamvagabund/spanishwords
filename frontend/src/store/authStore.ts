import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '../types'
import * as authApi from '../services/authApi'
import { errorMessage } from '../services/http'
import { useStore, flushAll } from './useStore'

type ProfilePatch = Partial<Pick<User, 'nickname' | 'avatar' | 'selectedLanguage'>>

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
  updateProfile: (data: ProfilePatch) => Promise<void>
  setSelectedLanguage: (code: string) => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const authenticate = async (fn: () => Promise<authApi.AuthResponse>, fallback: string) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await fn()
          if (!token || !user) throw new Error(fallback)
          set({ user, token, isAuthenticated: true, isLoading: false, error: null })
          await useStore.getState().loadProgress()
        } catch (error) {
          set({ isLoading: false, error: errorMessage(error, fallback) })
          throw error
        }
      }

      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        setUser: user => set({ user }),

        login: (email, password) => authenticate(() => authApi.login(email, password), 'Помилка входу'),
        register: (email, password) => authenticate(() => authApi.register(email, password), 'Помилка реєстрації'),

        logout: () => {
          flushAll()
          useStore.getState().clear()
          set({ user: null, token: null, isAuthenticated: false, error: null, isLoading: false })
        },

        checkAuth: async () => {
          const token = get().token
          if (!token) {
            set({ user: null, isAuthenticated: false })
            return
          }
          // Cached progress shows immediately; server progress refreshes in parallel.
          const progressPromise = useStore.getState().loadProgress()
          try {
            const user = await authApi.getProfile(token)
            set({ user: { ...get().user, ...user }, isAuthenticated: true, error: null })
          } catch (error) {
            // Only drop the session on a real auth failure, not when the server is asleep/offline.
            const status = axios.isAxiosError(error) ? error.response?.status : undefined
            if (status === 401 || status === 403) get().logout()
          }
          await progressPromise
        },

        updateProfile: async data => {
          const token = get().token
          if (!token) throw new Error('Не авторизовано')
          const updated = await authApi.updateProfile(token, data)
          const current = get().user
          if (current) set({ user: { ...current, ...updated } })
        },

        setSelectedLanguage: async code => {
          const { user, token } = get()
          if (!user || user.selectedLanguage === code) return
          set({ user: { ...user, selectedLanguage: code } })
          if (!token) return
          try {
            await authApi.updateProfile(token, { selectedLanguage: code })
          } catch {
            /* non-critical: kept locally */
          }
        },
      }
    },
    {
      name: 'auth-storage',
      partialize: state => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
