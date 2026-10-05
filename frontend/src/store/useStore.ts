import { create } from 'zustand'
import type { LangProgress, ProgressMap } from '../types'
import { deleteProgress, fetchProgress, saveProgress } from '../services/progress'
import { errorMessage } from '../services/http'
import { useAuthStore } from './authStore'

export const emptyProgress = (): LangProgress => ({
  completedBlocks: [],
  mistakes: {},
  learnedWords: [],
  currentLevel: 1,
  averageScore: 0,
})

const EMPTY: LangProgress = emptyProgress()

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface ProgressState {
  progress: ProgressMap
  status: Status
  error: string | null
  /** Load cached progress for the current user, then fetch from the server. */
  loadProgress: () => Promise<void>
  clear: () => void
  completeBlock: (lang: string, blockId: string, score: number, wordIds: string[]) => void
  addMistake: (lang: string, wordId: string) => void
  removeMistake: (lang: string, wordId: string) => void
  /** Reset one language on the server and locally. */
  reset: (lang: string) => Promise<void>
}

const cacheKey = (userId: string) => `progress-cache:${userId}`

const readCache = (userId: string): ProgressMap | null => {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    return raw ? (JSON.parse(raw) as ProgressMap) : null
  } catch {
    return null
  }
}

const writeCache = (progress: ProgressMap) => {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(progress))
  } catch {
    /* quota / private mode */
  }
}

const levelFor = (completed: number) => (completed >= 10 ? 4 : completed >= 7 ? 3 : completed >= 4 ? 2 : 1)

// ---- debounced per-language save ----
const SAVE_DELAY = 800
const timers: Record<string, ReturnType<typeof setTimeout>> = {}
const dirty = new Set<string>()

function scheduleSave(lang: string) {
  dirty.add(lang)
  clearTimeout(timers[lang])
  timers[lang] = setTimeout(() => void flush(lang), SAVE_DELAY)
}

async function flush(lang: string) {
  const token = useAuthStore.getState().token
  const data = useStore.getState().progress[lang]
  if (!token || !data) return
  dirty.delete(lang)
  try {
    await saveProgress(token, lang, data)
  } catch {
    // keep it dirty; retried on next change, when the tab is hidden, or when back online
    dirty.add(lang)
  }
}

export function flushAll() {
  ;[...dirty].forEach(lang => {
    clearTimeout(timers[lang])
    void flush(lang)
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushAll)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll()
  })
}

export const useStore = create<ProgressState>()((set, get) => {
  const update = (lang: string, fn: (p: LangProgress) => LangProgress) => {
    const current = get().progress[lang] ?? emptyProgress()
    const progress = { ...get().progress, [lang]: fn(current) }
    set({ progress })
    writeCache(progress)
    scheduleSave(lang)
  }

  return {
    progress: {},
    status: 'idle',
    error: null,

    loadProgress: async () => {
      const { user, token } = useAuthStore.getState()
      if (!user || !token) return
      const cached = readCache(user.id)
      set({ progress: cached ?? {}, status: cached ? 'ready' : 'loading', error: null })
      try {
        const server = await fetchProgress(token)
        // Languages with unsynced local edits keep the local version.
        const merged: ProgressMap = { ...server }
        dirty.forEach(lang => {
          const local = get().progress[lang]
          if (local) merged[lang] = local
        })
        set({ progress: merged, status: 'ready' })
        writeCache(merged)
      } catch (e) {
        set({ status: cached ? 'ready' : 'error', error: errorMessage(e, 'Не вдалося завантажити прогрес') })
      }
    },

    clear: () => {
      Object.values(timers).forEach(clearTimeout)
      dirty.clear()
      set({ progress: {}, status: 'idle', error: null })
    },

    completeBlock: (lang, blockId, score, wordIds) =>
      update(lang, p => {
        const completedBlocks = [
          ...p.completedBlocks.filter(b => b.blockId !== blockId),
          { blockId, score, completedAt: new Date().toISOString() },
        ]
        const avg = completedBlocks.reduce((s, b) => s + b.score, 0) / completedBlocks.length
        return {
          ...p,
          completedBlocks,
          learnedWords: [...new Set([...p.learnedWords, ...wordIds])],
          averageScore: Math.round(avg * 100) / 100,
          currentLevel: Math.max(p.currentLevel, levelFor(completedBlocks.length)),
        }
      }),

    addMistake: (lang, wordId) =>
      update(lang, p => ({ ...p, mistakes: { ...p.mistakes, [wordId]: (p.mistakes[wordId] || 0) + 1 } })),

    removeMistake: (lang, wordId) => {
      if (!get().progress[lang]?.mistakes[wordId]) return
      update(lang, p => {
        const mistakes = { ...p.mistakes }
        delete mistakes[wordId]
        return { ...p, mistakes }
      })
    },

    reset: async lang => {
      const token = useAuthStore.getState().token
      if (!token) throw new Error('Не авторизовано')
      clearTimeout(timers[lang])
      dirty.delete(lang)
      await deleteProgress(token, lang)
      const progress = { ...get().progress }
      delete progress[lang]
      set({ progress })
      writeCache(progress)
    },
  }
})

/** Progress of one language (stable empty object when none). */
export const useLangProgress = (lang: string | undefined): LangProgress =>
  useStore(s => (lang ? s.progress[lang] : undefined) ?? EMPTY)

// Drop legacy single-language localStorage keys from the old version.
try {
  Object.keys(localStorage)
    .filter(k => k === 'user-progress' || k.startsWith('user-progress-'))
    .forEach(k => localStorage.removeItem(k))
} catch {
  /* ignore */
}
