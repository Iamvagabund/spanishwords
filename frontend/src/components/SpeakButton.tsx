import type { MouseEvent } from 'react'
import { speak, speechSupported } from '../utils/speech'

interface Props {
  text: string
  lang: string
  className?: string
  size?: 'sm' | 'md'
  label?: string
}

export default function SpeakButton({ text, lang, className = '', size = 'md', label = 'Озвучити' }: Props) {
  if (!speechSupported || !text) return null
  const onClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    speak(text, lang)
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 transition hover:bg-brand-500/20 active:scale-90 dark:text-brand-300 ${
        size === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-lg'
      } ${className}`}
    >
      🔊
    </button>
  )
}
