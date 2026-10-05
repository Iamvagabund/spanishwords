import { http, authHeader } from './http'
import type { LangProgress, ProgressMap } from '../types'

export async function fetchProgress(token: string): Promise<ProgressMap> {
  const { data } = await http.get<ProgressMap>('/user/progress', { headers: authHeader(token) })
  return data ?? {}
}

export async function saveProgress(token: string, code: string, progress: LangProgress): Promise<LangProgress> {
  const { data } = await http.put<LangProgress>(`/user/progress/${encodeURIComponent(code)}`, progress, {
    headers: authHeader(token),
  })
  return data
}

export async function deleteProgress(token: string, code: string): Promise<void> {
  await http.delete(`/user/progress/${encodeURIComponent(code)}`, { headers: authHeader(token) })
}
