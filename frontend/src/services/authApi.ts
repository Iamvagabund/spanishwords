import { User } from '../types'

const API_URL = 'http://localhost:5000/api'

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
  }
  token: string
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  console.log('Sending login request to:', `${API_URL}/auth/login`)
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('Login response status:', response.status)

    const data = await response.json()

    if (!response.ok) {
      console.log('Login error response:', data)
      throw new Error(data.message || 'Помилка входу')
    }

    console.log('Login success response:', data)
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Помилка реєстрації')
    }

    return data
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function removeToken(): void {
  localStorage.removeItem('token')
} 