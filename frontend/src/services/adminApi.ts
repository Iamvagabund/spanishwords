import { API_URL } from '../config'
import { useAuthStore } from '../store/authStore'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export interface AdminLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
  isActive: boolean
  blockCount?: number
}

export interface WordInput {
  id?: string
  term: string
  translation: string
  example?: string
  exampleTranslation?: string
}

export interface AdminBlock {
  id: string
  order: number
  title: string
  titleTarget: string
  description: string
  level: Level
  words: (WordInput & { id: string })[]
}

export interface BlockInput {
  language: string
  order?: number
  title: string
  titleTarget: string
  description: string
  level: Level
  words: WordInput[]
}

export type ImportBlock = Omit<BlockInput, 'language'>

export interface LangProgressSummary {
  completedBlocks?: unknown[] | number
  averageScore?: number
  learnedWords?: unknown[] | number
  currentLevel?: number
  [k: string]: unknown
}

export interface AdminUser {
  id?: string
  _id?: string
  email: string
  nickname?: string
  role: 'user' | 'admin'
  createdAt?: string
  progress?: Record<string, LangProgressSummary>
}

export interface Statistics {
  totalUsers: number
  totalAdmins: number
  perLanguage: {
    code: string
    learners: number
    blocks: number
    words: number
    avgScore: number
    completedBlocks: number
  }[]
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new ApiError('Не вдалося з’єднатися з сервером', 0)
  }
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'message' in data && String((data as { message: unknown }).message)) ||
      `Помилка ${res.status}`
    throw new ApiError(String(msg), res.status)
  }
  return data as T
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const userId = (u: AdminUser) => (u.id ?? u._id ?? '') as string

export const adminApi = {
  getLanguages: () => request<AdminLanguage[]>('/admin/languages'),
  createLanguage: (b: Omit<AdminLanguage, 'isActive' | 'blockCount'>) =>
    request<AdminLanguage>('/admin/languages', json('POST', b)),
  updateLanguage: (code: string, b: Partial<AdminLanguage>) =>
    request<AdminLanguage>(`/admin/languages/${encodeURIComponent(code)}`, json('PUT', b)),

  getBlocks: (language: string) =>
    request<AdminBlock[]>(`/admin/blocks?language=${encodeURIComponent(language)}`),
  createBlock: (b: BlockInput) => request<AdminBlock>('/admin/blocks', json('POST', b)),
  updateBlock: (id: string, b: BlockInput) => request<AdminBlock>(`/admin/blocks/${id}`, json('PUT', b)),
  deleteBlock: (id: string) => request<unknown>(`/admin/blocks/${id}`, json('DELETE')),
  reorderBlocks: (language: string, ids: string[]) =>
    request<unknown>('/admin/blocks/reorder', json('POST', { language, ids })),
  importBlocks: (language: string, blocks: ImportBlock[]) =>
    request<unknown>('/admin/blocks/import', json('POST', { language, blocks })),

  getUsers: () => request<AdminUser[]>('/admin/users'),
  setRole: (id: string, role: 'user' | 'admin') =>
    request<AdminUser>(`/admin/users/${id}/role`, json('PATCH', { role })),
  resetProgress: (id: string, language?: string) =>
    request<unknown>(`/admin/users/${id}/reset-progress`, json('POST', language ? { language } : {})),

  getStatistics: () => request<Statistics>('/admin/statistics'),
}
