import { http, authHeader } from './http'

export interface ActivityResponse {
  dailyGoal: number
  activity: Record<string, number>
}

export async function getActivity(token: string): Promise<ActivityResponse> {
  const { data } = await http.get<ActivityResponse>('/user/activity', { headers: authHeader(token) })
  return data
}

export async function postActivity(token: string, date: string, delta: number): Promise<ActivityResponse> {
  const { data } = await http.post<ActivityResponse>('/user/activity', { date, delta }, { headers: authHeader(token) })
  return data
}

/** Local calendar date as YYYY-MM-DD. */
export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Consecutive days with count >= 1 ending today (or yesterday if today is 0). */
export function computeStreak(activity: Record<string, number>, today = new Date()): number {
  let day = (activity[localDate(today)] ?? 0) > 0 ? today : addDays(today, -1)
  let streak = 0
  while ((activity[localDate(day)] ?? 0) > 0) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}
