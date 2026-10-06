// Colour themes for blocks and languages. Full class strings so Tailwind can see them.

export interface Tone {
  /** gradient for hero/icon backgrounds */
  gradient: string
  /** soft tinted background for chips/cards */
  soft: string
  /** text colour on soft background */
  text: string
  /** solid ring/border colour */
  ring: string
}

const tones: Tone[] = [
  { gradient: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-300', ring: 'ring-violet-500' },
  { gradient: 'from-orange-400 to-rose-500', soft: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-300', ring: 'ring-orange-500' },
  { gradient: 'from-sky-400 to-indigo-500', soft: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-300', ring: 'ring-sky-500' },
  { gradient: 'from-emerald-400 to-teal-500', soft: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-emerald-500' },
  { gradient: 'from-amber-300 to-orange-500', soft: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300', ring: 'ring-amber-500' },
  { gradient: 'from-pink-400 to-rose-500', soft: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-300', ring: 'ring-pink-500' },
  { gradient: 'from-cyan-400 to-blue-500', soft: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-300', ring: 'ring-cyan-500' },
  { gradient: 'from-lime-400 to-emerald-500', soft: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-300', ring: 'ring-lime-500' },
]

/** Stable colour for a block by its order (1-based). */
export const blockTone = (order: number): Tone => tones[(Math.max(1, order) - 1) % tones.length]

const emojiByKeyword: [RegExp, string][] = [
  [/приві|салю|greet|salud/i, '👋'],
  [/ввічл|політ|cortes|polite/i, '🙏'],
  [/числ|number|númer/i, '🔢'],
  [/колір|кольор|color|colour/i, '🎨'],
  [/сім|famil/i, '👨‍👩‍👧'],
  [/тіл|body|cuerpo/i, '🫀'],
  [/їж|food|comid/i, '🍎'],
  [/напо|drink|bebid/i, '🥤'],
  [/дім|house|home|casa/i, '🏠'],
  [/одяг|cloth|ropa/i, '👕'],
  [/дні|місяц|day|month|día|mes/i, '📅'],
  [/погод|час|weather|time|tiempo/i, '⛅'],
  [/міст|city|ciudad/i, '🏙️'],
  [/транс|transport/i, '🚌'],
  [/профес|job|profes/i, '💼'],
  [/рух|movement|movim/i, '🏃'],
  [/повсяк|daily|diar|дієсл|verb/i, '⚡'],
  [/емоц|emoti|emoci/i, '😊'],
  [/подор|travel|viaj/i, '✈️'],
]

/** Emoji icon for a block, guessed from its title; falls back to a book. */
export const blockEmoji = (title: string): string =>
  emojiByKeyword.find(([re]) => re.test(title))?.[1] ?? '📘'

/** Accent per language code. */
export const languageTone = (code: string): Tone =>
  code === 'es' ? tones[1] : code === 'en' ? tones[2] : tones[0]
