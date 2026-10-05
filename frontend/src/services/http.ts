import axios from 'axios'
import { API_URL } from '../config'

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const authHeader = (token: string | null | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : {}

/** Human-readable (Ukrainian) message from an axios/fetch error. */
export function errorMessage(error: unknown, fallback = 'Сталася помилка. Спробуйте ще раз.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Сервер недоступний. Перевірте підключення до інтернету.'
    const msg = (error.response.data as { message?: string } | undefined)?.message
    return msg || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
