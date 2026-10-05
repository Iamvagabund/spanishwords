import { http, authHeader } from './http'
import type { User } from '../types'

export interface AuthResponse {
  user: User
  token: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', { email, password })
  return data
}

export async function getProfile(token: string): Promise<User> {
  const { data } = await http.get<User>('/user/profile', { headers: authHeader(token) })
  return data
}

export async function updateProfile(token: string, body: Partial<Pick<User, 'nickname' | 'avatar' | 'selectedLanguage'>>): Promise<User> {
  const { data } = await http.put<User>('/user/profile', body, { headers: authHeader(token) })
  return data
}
