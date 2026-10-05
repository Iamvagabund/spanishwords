import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

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

const inputCls =
  'w-full rounded-xl px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60'

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-zinc-50 dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30">
            <LanguageIcon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Вивчаємо слова</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Іспанська · English · та інші</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-900/5">
          <div role="tablist" className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-800">
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
                className={`rounded-lg py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                  isLogin === t.v
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputCls}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isLogin ? undefined : 6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={`${inputCls} pr-12`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-r-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Щонайменше 6 символів</p>
              )}
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
                  <div className="flex items-start gap-2 rounded-xl p-3 text-sm bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                    <span>{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Зачекайте…' : isLogin ? 'Увійти' : 'Створити акаунт'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isLogin ? 'Немає акаунта?' : 'Вже маєте акаунт?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isLogin ? 'Зареєструватися' : 'Увійти'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
