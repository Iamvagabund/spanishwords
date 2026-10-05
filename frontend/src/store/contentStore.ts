import { create } from 'zustand'
import type { Block, Language } from '../types'
import { fetchBlocks, fetchLanguages } from '../services/content'
import { errorMessage } from '../services/http'

export type Status = 'idle' | 'loading' | 'ready' | 'error'

interface BlocksEntry {
  status: Status
  blocks: Block[]
  error: string | null
}

interface ContentState {
  languages: Language[]
  languagesStatus: Status
  languagesError: string | null
  blocks: Record<string, BlocksEntry>
  loadLanguages: (force?: boolean) => Promise<void>
  loadBlocks: (code: string, force?: boolean) => Promise<void>
}

const inflight: Record<string, Promise<void> | undefined> = {}

export const useContentStore = create<ContentState>()((set, get) => ({
  languages: [],
  languagesStatus: 'idle',
  languagesError: null,
  blocks: {},

  loadLanguages: (force = false) => {
    const s = get()
    if (!force && (s.languagesStatus === 'ready' || s.languagesStatus === 'loading')) {
      return inflight.__languages ?? Promise.resolve()
    }
    set({ languagesStatus: 'loading', languagesError: null })
    const p = fetchLanguages()
      .then(languages => set({ languages, languagesStatus: 'ready' }))
      .catch(e => set({ languagesStatus: 'error', languagesError: errorMessage(e, 'Не вдалося завантажити мови') }))
      .finally(() => {
        inflight.__languages = undefined
      })
    inflight.__languages = p
    return p
  },

  loadBlocks: (code, force = false) => {
    const entry = get().blocks[code]
    if (!force && entry && (entry.status === 'ready' || entry.status === 'loading')) {
      return inflight[code] ?? Promise.resolve()
    }
    const setEntry = (patch: Partial<BlocksEntry>) =>
      set(s => ({
        blocks: {
          ...s.blocks,
          [code]: { ...(s.blocks[code] ?? { status: 'idle', blocks: [], error: null }), ...patch },
        },
      }))
    setEntry({ status: 'loading', error: null })
    const p = fetchBlocks(code)
      .then(blocks => setEntry({ status: 'ready', blocks }))
      .catch(e => setEntry({ status: 'error', error: errorMessage(e, 'Не вдалося завантажити блоки') }))
      .finally(() => {
        inflight[code] = undefined
      })
    inflight[code] = p
    return p
  },
}))
