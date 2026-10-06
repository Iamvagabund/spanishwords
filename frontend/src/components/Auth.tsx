import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { ThemeToggle } from './ThemeToggle'

function friendlyError(raw: string | null, isLogin: boolean): string | null {
  if (!raw) return null
  const status = raw.match(/status code (\d{3})/)?.[1]
  if (status === '401' || status === '403') return 'Невірний email або пароль'
  if (status === '409') return 'Користувач з таким email вже існує'
  if (status === '400' || status === '422') return 'Перевірте правильність введених даних'
  if (status && status.startsWith('5')) return 'Помилка сервера. Спробуйте пізніше.'
  if (/network error|failed to fetch/i.test(raw)) return 'Сервер недоступний. Перевірте з’єднання.'
  if (/invalid response/i.test(raw)) return 'Некоректна відповідь сервера. Спробуйте ще раз.'
  // Ukrainian messages from the store are already human-readable
  if (/[а-яіїєґ]/i.test(raw)) return raw
  return isLogin ? 'Не вдалося увійти. Спробуйте ще раз.' : 'Не вдалося зареєструватися. Спробуйте ще раз.'
}

// Floating word bubbles in the hero (positions in %, kept inside to avoid horizontal scroll)
const bubbles = [
  { t: '🇪🇸 ¡Hola!', x: 6, y: 14, d: 0 },
  { t: '🇬🇧 Hello', x: 66, y: 8, d: 0.6 },
  { t: 'Gracias 🙏', x: 58, y: 84, d: 1.2 },
  { t: '🇬🇧 Friend', x: 6, y: 80, d: 0.3 },
  { t: 'Amigo 🤝', x: 34, y: 2, d: 0.9 },
  { t: 'Thanks ✨', x: 72, y: 36, d: 1.5 },
  { t: 'Café ☕', x: 2, y: 40, d: 1.8 },
]

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, register, isLoading, error, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  // Clear stale errors (e.g. from checkAuth or the other mode) when switching mode
  useEffect(() => {
    useAuthStore.setState({ error: null })
  }, [isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    try {
      if (isLogin) await login(email.trim(), password)
      else await register(email.trim(), password)
    } catch {
      // error is shown from the store
    }
  }

  const message = friendlyError(error, isLogin)

  return (
    <div className="app-bg relative flex min-h-[100dvh] flex-col overflow-hidden text-ink sm:items-center sm:justify-center sm:px-4 sm:py-10">
      <div className="pt-safe absolute right-3 top-3 z-20">
        <div className="mt-1">
          <ThemeToggle className="bg-surface/60 backdrop-blur" />
        </div>
      </div>

      {/* Hero */}
      <div className="pt-safe relative flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center sm:mb-8 sm:flex-none sm:pb-0">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gradient opacity-30 blur-3xl" />
          {bubbles.map(b => (
            <motion.span
              key={b.t}
              className="glass absolute whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-ink-2 shadow-soft sm:text-sm"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.9, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { delay: b.d * 0.3, duration: 0.4 },
                scale: { delay: b.d * 0.3, type: 'spring' },
                y: { delay: b.d, duration: 4 + b.d, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              {b.t}
            </motion.span>
          ))}
        </div>
        <motion.img
          src="/icon.svg"
          alt=""
          initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="relative h-24 w-24 rounded-[1.75rem] shadow-glow sm:h-20 sm:w-20"
        />
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mt-5 text-4xl font-extrabold sm:text-5xl"
        >
          <span className="text-gradient">Слова</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-2 max-w-xs text-base font-semibold text-ink-2"
        >
          Іспанська та англійська — по 5 хвилин на день 🚀
        </motion.p>
      </div>

      {/* Sheet / card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.15 }}
        className="glass pb-safe relative z-10 w-full rounded-t-4xl border-b-0 shadow-lift sm:max-w-md sm:rounded-4xl sm:border-b"
      >
        <div className="px-5 pb-6 pt-3 sm:p-8">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />
          <div role="tablist" className="relative mb-6 grid grid-cols-2 rounded-2xl bg-surface-2 p-1">
            {[
              { v: true, label: 'Вхід' },
              { v: false, label: 'Реєстрація' },
            ].map(t => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={isLogin === t.v}
                onClick={() => setIsLogin(t.v)}
                className={`relative min-h-[44px] rounded-xl text-sm font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 ${
                  isLogin === t.v ? 'text-ink' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {isLogin === t.v && (
                  <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input pl-12"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink-2">
                Пароль
              </label>
              <div className="relative">
                <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isLogin ? undefined : 6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="input pl-12 pr-14"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                  className="btn-icon absolute right-1.5 top-1/2 -translate-y-1/2 active:-translate-y-1/2"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && <p className="mt-1.5 text-xs font-semibold text-ink-3">Щонайменше 6 символів</p>}
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="overflow-hidden"
                >
                  <div className="flex animate-shake items-start gap-2 rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                    <span>{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg mt-2 w-full">
              {isLoading && (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Зачекайте…' : isLogin ? 'Увійти' : 'Створити акаунт'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-3">
            {isLogin ? 'Немає акаунта?' : 'Вже маєте акаунт?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-bold text-brand-500 hover:underline dark:text-brand-300">
              {isLogin ? 'Зареєструватися' : 'Увійти'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
