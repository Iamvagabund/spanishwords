import { AnimatePresence, motion } from 'framer-motion'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { useTheme } from '../context/ThemeContext'

/** Animated sun/moon theme switch. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Світла тема' : 'Темна тема'
  return (
    <button type="button" onClick={toggleTheme} aria-label={label} title={label} className={`btn-icon overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 18, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -18, rotate: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="grid place-items-center"
        >
          {dark ? <MoonIcon className="h-5 w-5 text-brand-300" /> : <SunIcon className="h-5 w-5 text-amber-500" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
