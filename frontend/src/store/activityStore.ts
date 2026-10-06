import { create } from 'zustand'
import { getActivity, postActivity, localDate, computeStreak } from '../services/activity'
import { useAuthStore } from './authStore'

const FLUSH_MS = 2000
const CELEBRATED_KEY = 'goal-celebrated'

interface ActivityState {
  dailyGoal: number
  activity: Record<string, number>
  loaded: boolean
  /** true when today's goal was just reached (celebrated once per day) */
  justReachedGoal: boolean
  load: () => Promise<void>
  record: (delta?: number) => void
  setGoal: (goal: number) => void
  dismissCelebration: () => void
  reset: () => void
}

let pending: Record<string, number> = {}
let timer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  timer = null
  const token = useAuthStore.getState().token
  const batch = pending
  pending = {}
  if (!token) return
  for (const [date, total] of Object.entries(batch)) {
    let left = total
    while (left > 0) {
      const delta = Math.min(100, left)
      left -= delta
      try {
        const res = await postActivity(token, date, delta)
        if (res?.dailyGoal) useActivityStore.setState({ dailyGoal: res.dailyGoal })
      } catch {
        /* optimistic count stays; non-critical */
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (timer) {
      clearTimeout(timer)
      void flush()
    }
  })
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  dailyGoal: 10,
  activity: {},
  loaded: false,
  justReachedGoal: false,

  load: async () => {
    const { token, user } = useAuthStore.getState()
    if (user?.dailyGoal) set({ dailyGoal: user.dailyGoal })
    if (!token) return
    try {
      const res = await getActivity(token)
      const activity = { ...(res.activity ?? {}) }
      for (const [d, n] of Object.entries(pending)) activity[d] = (activity[d] ?? 0) + n
      set({ activity, dailyGoal: res.dailyGoal || get().dailyGoal, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  record: (delta = 1) => {
    if (!useAuthStore.getState().token) return
    const date = localDate()
    const { activity, dailyGoal } = get()
    const before = activity[date] ?? 0
    const after = before + delta
    let justReachedGoal = get().justReachedGoal
    if (before < dailyGoal && after >= dailyGoal) {
      let already = false
      try {
        already = localStorage.getItem(CELEBRATED_KEY) === date
        localStorage.setItem(CELEBRATED_KEY, date)
      } catch {
        /* ignore */
      }
      if (!already) justReachedGoal = true
    }
    set({ activity: { ...activity, [date]: after }, justReachedGoal })
    pending[date] = (pending[date] ?? 0) + delta
    if (!timer) timer = setTimeout(() => void flush(), FLUSH_MS)
  },

  setGoal: goal => set({ dailyGoal: goal }),
  dismissCelebration: () => set({ justReachedGoal: false }),
  reset: () => {
    pending = {}
    if (timer) clearTimeout(timer)
    timer = null
    set({ activity: {}, dailyGoal: 10, loaded: false, justReachedGoal: false })
  },
}))

export function useTodayCount(): number {
  return useActivityStore(s => s.activity[localDate()] ?? 0)
}

export function useStreak(): number {
  return computeStreak(useActivityStore(s => s.activity))
}
