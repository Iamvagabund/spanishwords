import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
  }
  token: string
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', { email, password })
    return response.data
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export const logout = async () => {
  const response = await api.post('/auth/logout')
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
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