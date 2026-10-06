const PREFERRED: Record<string, string[]> = {
  es: ['es-ES', 'es-MX', 'es-US', 'es'],
  en: ['en-GB', 'en-US', 'en-AU', 'en'],
}

export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

let voices: SpeechSynthesisVoice[] = []
const cache = new Map<string, SpeechSynthesisVoice | null>()

function refreshVoices() {
  if (!speechSupported) return
  voices = window.speechSynthesis.getVoices()
  cache.clear()
}

if (speechSupported) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

function score(v: SpeechSynthesisVoice, prefs: string[]): number {
  const lang = v.lang.replace('_', '-').toLowerCase()
  let s = -1
  prefs.forEach((p, i) => {
    const pl = p.toLowerCase()
    if (s < 0 && (lang === pl || (pl.length === 2 && lang.startsWith(pl)))) s = (prefs.length - i) * 10
  })
  if (s < 0) return -1
  const name = v.name.toLowerCase()
  if (name.includes('compact')) s -= 6
  if (!v.localService) s += 4 // network voices usually sound better
  if (/google|natural|neural|premium|enhanced|siri/.test(name)) s += 3
  return s
}

export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const code = lang.slice(0, 2).toLowerCase()
  if (cache.has(code)) return cache.get(code) ?? null
  if (!voices.length) refreshVoices()
  const prefs = PREFERRED[code] ?? [code]
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -1
  for (const v of voices) {
    const sc = score(v, prefs)
    if (sc > bestScore) {
      best = v
      bestScore = sc
    }
  }
  if (voices.length) cache.set(code, best)
  return best
}

export function speak(text: string, lang: string, rate = 0.9): void {
  if (!speechSupported || !text?.trim()) return
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text.trim())
    const voice = pickVoice(lang)
    const code = lang.slice(0, 2).toLowerCase()
    u.lang = voice?.lang ?? PREFERRED[code]?.[0] ?? lang
    if (voice) u.voice = voice
    u.rate = rate
    synth.speak(u)
  } catch {
    /* no-op */
  }
}

const AUTO_KEY = 'auto-speak'

export function getAutoSpeak(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== '0'
  } catch {
    return true
  }
}

export function setAutoSpeak(on: boolean): void {
  try {
    localStorage.setItem(AUTO_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}
