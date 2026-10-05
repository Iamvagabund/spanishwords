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
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useStore } from '../store/useStore'
import Stats from '../components/Stats'
import { useTheme } from '../context/ThemeContext'

const card = 'rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6'
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const btnPrimary = `${btnBase} bg-indigo-600 hover:bg-indigo-500 text-white`
const btnSecondary = `${btnBase} bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100`

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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.email)}&background=6366f1&color=fff`

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-6 sm:py-10">
      <section className={card}>
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative shrink-0">
            <img
              src={avatarSrc}
              alt="Аватар"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-zinc-100 dark:ring-zinc-800"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Змінити аватар"
              className="absolute -bottom-1 -right-1 rounded-full bg-indigo-600 p-2 text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:opacity-50"
            >
              <CameraIcon className="h-4 w-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          <div className="w-full min-w-0 flex-1">
            {isEditing ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleSave()
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <input
                  type="text"
                  value={nickname}
                  autoFocus
                  maxLength={32}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setIsEditing(false)}
                  placeholder="Введіть нікнейм"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={isLoading} className={btnPrimary}>
                    {isLoading ? 'Збереження…' : 'Зберегти'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setNickname(user.nickname || '')
                    }}
                    disabled={isLoading}
                    className={btnSecondary}
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {user.nickname || 'Встановіть нікнейм'}
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  aria-label="Редагувати нікнейм"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            <p className="mt-1 truncate text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
              className={`${btnSecondary} px-3`}
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button onClick={handleLogout} className={btnSecondary}>
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Вийти
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Мій прогрес</h2>
          {languages.length > 0 && (
            <div role="tablist" className="inline-flex self-start rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/70">
              {languages.map(l => (
                <button
                  key={l.code}
                  role="tab"
                  aria-selected={lang === l.code}
                  onClick={() => {
                    setLang(l.code)
                    setConfirmReset(false)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                    lang === l.code
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <span aria-hidden>{l.flag}</span> {l.name}
                  {progressMap[l.code]?.completedBlocks.length ? (
                    <span className="text-xs tabular-nums text-zinc-400">{progressMap[l.code].completedBlocks.length}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
        {lang && <Stats lang={lang} />}
        {currentLang && user.selectedLanguage !== currentLang.code && (
          <button
            onClick={() => {
              void setSelectedLanguage(currentLang.code)
              navigate(`/${currentLang.code}`)
            }}
            className={`${btnSecondary} mt-3`}
          >
            Вивчати {currentLang.flag} {currentLang.name}
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <h2 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Небезпечна зона</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Скидання видалить усі пройдені блоки, вивчені слова та помилки для мови «{currentLang?.name ?? lang}». Цю дію неможливо скасувати.
              </p>
            </div>
          </div>
          {!confirmReset && (
            <button
              onClick={() => setConfirmReset(true)}
              disabled={isLoading || !lang}
              className={`${btnBase} shrink-0 border border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400`}
            >
              Скинути прогрес
            </button>
          )}
        </div>
        <AnimatePresence>
          {confirmReset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-2 border-t border-rose-500/20 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300 sm:mr-auto">Ви впевнені?</p>
                <button onClick={() => setConfirmReset(false)} disabled={isLoading} className={btnSecondary}>
                  Скасувати
                </button>
                <button
                  onClick={handleResetProgress}
                  disabled={isLoading}
                  className={`${btnBase} bg-rose-600 text-white hover:bg-rose-500`}
                >
                  {isLoading ? 'Скидання…' : 'Так, скинути'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  )
}
