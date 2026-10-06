import { useState, useRef, useEffect } from 'react'
import { useContentStore } from '../store/contentStore'
import { errorMessage } from '../services/http'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  CameraIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  MoonIcon,
  SunIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { languageTone } from '../theme/palette'
import { useAuthStore } from '../store/authStore'
import { useStore } from '../store/useStore'
import Stats from '../components/Stats'
import { useTheme } from '../context/ThemeContext'

const resizeImage = (file: File, maxSize = 200): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      const scale = Math.min(1, maxSize / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })

export function ProfilePage() {
  const { user, updateProfile, logout, setSelectedLanguage } = useAuthStore()
  const resetLangProgress = useStore(s => s.reset)
  const progressMap = useStore(s => s.progress)
  const { languages, loadLanguages } = useContentStore()
  const [lang, setLang] = useState(user?.selectedLanguage || '')
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setNickname(user?.nickname || '')
  }, [user?.nickname])

  useEffect(() => {
    void loadLanguages()
  }, [loadLanguages])

  useEffect(() => {
    if (!lang && languages.length) setLang(user?.selectedLanguage || languages[0].code)
  }, [lang, languages, user?.selectedLanguage])

  const currentLang = languages.find(l => l.code === lang)

  if (!user) return null

  const handleSave = async () => {
    const value = nickname.trim()
    if (!value) {
      toast.error('Нікнейм не може бути порожнім')
      return
    }
    try {
      setIsLoading(true)
      await updateProfile({ nickname: value })
      setIsEditing(false)
      toast.success('Нікнейм оновлено')
    } catch {
      toast.error('Помилка оновлення ніку')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Розмір файлу не може перевищувати 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, виберіть зображення')
      return
    }
    try {
      setIsLoading(true)
      const avatar = await resizeImage(file)
      // updateProfile PUTs to the API and updates the store, so the avatar re-renders without reload
      await updateProfile({ avatar })
      toast.success('Аватарку оновлено')
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error('Помилка завантаження аватарки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Ви успішно вийшли з акаунту')
    navigate('/auth')
  }

  const handleResetProgress = async () => {
    setIsLoading(true)
    try {
      await resetLangProgress(lang)
      setConfirmReset(false)
      toast.success(`Прогрес «${currentLang?.name ?? lang}» скинуто`)
    } catch (error) {
      toast.error(errorMessage(error, 'Помилка скидання досягнень'))
    } finally {
      setIsLoading(false)
    }
  }

  const avatarSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.email)}&background=7c4dff&color=fff`
  const progressCount = (code: string) => progressMap[code]?.completedBlocks.length ?? 0
  const totalCompleted = languages.reduce((n, l) => n + progressCount(l.code), 0)
  const studying = languages.find(l => l.code === user.selectedLanguage)

  const rowClass =
    'flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition active:bg-surface-2 sm:hover:bg-surface-2/60'
  const rowIcon = (bg: string) => `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${bg}`

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-4 sm:py-8">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-4xl bg-brand-gradient px-5 pb-6 pt-8 text-white shadow-lift sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Змінити аватар"
            className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-95 disabled:opacity-60"
          >
            <img src={avatarSrc} alt="Аватар" className="h-28 w-28 rounded-full object-cover ring-4 ring-white/70 shadow-lift" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              <CameraIcon className="h-8 w-8" />
            </span>
            <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-soft">
              <CameraIcon className="h-5 w-5" />
            </span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          <div className="w-full min-w-0 flex-1">
            {isEditing ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleSave()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={nickname}
                  autoFocus
                  maxLength={32}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setIsEditing(false)}
                  placeholder="Введіть нікнейм"
                  aria-label="Нікнейм"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-white/40 bg-white/20 px-4 py-3 font-bold text-white placeholder-white/70 backdrop-blur focus:border-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Зберегти"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft active:scale-95 disabled:opacity-60"
                >
                  <CheckIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Скасувати"
                  disabled={isLoading}
                  onClick={() => {
                    setIsEditing(false)
                    setNickname(user.nickname || '')
                  }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 active:scale-95"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="inline-flex max-w-full items-center gap-2 rounded-2xl px-2 py-1 transition active:bg-white/15 sm:-ml-2"
                aria-label="Редагувати нікнейм"
              >
                <span className="truncate font-display text-3xl font-extrabold">{user.nickname || 'Встановіть нікнейм'}</span>
                <PencilSquareIcon className="h-5 w-5 shrink-0 opacity-80" />
              </button>
            )}
            <p className="mt-1 truncate text-sm text-white/85">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {studying && (
                <span className="chip bg-white/20 text-white">
                  {studying.flag} Вивчаю: {studying.name}
                </span>
              )}
              <span className="chip bg-white/20 text-white">🏆 {totalCompleted} блоків</span>
              {user.role === 'admin' && (
                <span className="chip bg-amber-300 text-amber-900">
                  <ShieldCheckIcon className="h-3.5 w-3.5" /> Адмін
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* PROGRESS */}
        <section className="space-y-3">
          <h2 className="px-1 text-lg font-extrabold text-ink">Мій прогрес</h2>
          {languages.length > 0 && (
            <div role="tablist" className="flex w-full rounded-2xl bg-surface-2 p-1">
              {languages.map(l => {
                const active = lang === l.code
                return (
                  <button
                    key={l.code}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setLang(l.code)
                      setConfirmReset(false)
                    }}
                    className={`relative flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${
                      active ? 'text-white' : 'text-ink-2'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="profile-lang-tab"
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${languageTone(l.code).gradient} shadow-soft`}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative" aria-hidden>
                      {l.flag}
                    </span>
                    <span className="relative truncate">{l.name}</span>
                    {progressCount(l.code) > 0 && (
                      <span className={`relative chip px-1.5 py-0 ${active ? 'bg-white/25' : 'bg-surface text-ink-2'}`}>
                        {progressCount(l.code)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {lang && <Stats key={lang} lang={lang} />}
          {currentLang && user.selectedLanguage !== currentLang.code && (
            <button
              onClick={() => {
                void setSelectedLanguage(currentLang.code)
                navigate(`/${currentLang.code}`)
              }}
              className="btn btn-primary w-full sm:w-auto"
            >
              Вивчати {currentLang.flag} {currentLang.name}
            </button>
          )}
        </section>

        {/* SETTINGS */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-ink-3">Налаштування</h2>
            <div className="card divide-y divide-line overflow-hidden rounded-3xl p-0">
              <button type="button" onClick={toggleTheme} className={rowClass} role="switch" aria-checked={theme === 'dark'}>
                <span className={rowIcon('bg-gradient-to-br from-indigo-500 to-violet-600')}>
                  {theme === 'dark' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                </span>
                <span className="flex-1 font-semibold text-ink">Темна тема</span>
                <span
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${theme === 'dark' ? 'bg-emerald-500' : 'bg-line'}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${theme === 'dark' ? 'left-[1.375rem]' : 'left-0.5'}`}
                  />
                </span>
              </button>
              {languages.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    void setSelectedLanguage(l.code)
                    navigate(`/${l.code}`)
                  }}
                  className={rowClass}
                >
                  <span className={rowIcon(`bg-gradient-to-br ${languageTone(l.code).gradient}`)}>
                    <GlobeAltIcon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 font-semibold text-ink">
                    {l.flag} {l.name}
                  </span>
                  {user.selectedLanguage === l.code ? (
                    <CheckIcon className="h-5 w-5 text-brand-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-ink-3" />
                  )}
                </button>
              ))}
              <button type="button" onClick={handleLogout} className={rowClass}>
                <span className={rowIcon('bg-gradient-to-br from-zinc-400 to-zinc-600')}>
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </span>
                <span className="flex-1 font-semibold text-rose-600 dark:text-rose-400">Вийти</span>
                <ChevronRightIcon className="h-5 w-5 text-ink-3" />
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-rose-500">Небезпечна зона</h2>
            <div className="card overflow-hidden rounded-3xl border-rose-500/30 p-0">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                disabled={isLoading || !lang}
                className={`${rowClass} disabled:opacity-50`}
              >
                <span className={rowIcon('bg-gradient-to-br from-pink-400 to-rose-500')}>
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-rose-600 dark:text-rose-400">Скинути прогрес</span>
                  <span className="block truncate text-xs text-ink-2">
                    {currentLang ? `${currentLang.flag} ${currentLang.name}` : lang}
                  </span>
                </span>
                <ChevronRightIcon className="h-5 w-5 text-ink-3" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* CONFIRM SHEET */}
      <AnimatePresence>
        {confirmReset && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setConfirmReset(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="relative w-full max-w-md rounded-t-4xl bg-surface p-6 pb-safe text-center shadow-lift sm:rounded-4xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-soft animate-shake">
                <ExclamationTriangleIcon className="h-8 w-8" />
              </div>
              <h2 id="reset-title" className="text-xl font-extrabold text-ink">
                Скинути прогрес?
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink-2">
                Усі пройдені блоки, вивчені слова та помилки для мови «{currentLang?.name ?? lang}» буде видалено. Цю дію неможливо скасувати.
              </p>
              <div className="mt-6 flex flex-col gap-3 pb-2">
                <button onClick={handleResetProgress} disabled={isLoading} className="btn btn-danger btn-lg w-full">
                  {isLoading ? 'Скидання…' : 'Так, скинути'}
                </button>
                <button onClick={() => setConfirmReset(false)} disabled={isLoading} className="btn btn-secondary btn-lg w-full">
                  Скасувати
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
