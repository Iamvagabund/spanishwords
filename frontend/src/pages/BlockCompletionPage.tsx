import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowPathIcon, ArrowRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60'
const card = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl'

function scoreMood(score: number) {
  if (score >= 10) return { emoji: '🏆', uk: 'Бездоганно!' }
  if (score >= 9) return { emoji: '🎉', uk: 'Відмінно!' }
  if (score >= 7) return { emoji: '👏', uk: 'Добре!' }
  return { emoji: '💪', uk: 'Потрібно ще попрацювати' }
}

export function BlockCompletionPage() {
  const { order } = useParams()
  const navigate = useNavigate()
  const { code, blocks: storeBlocks } = useLang()
  const userProgress = useLangProgress(code)
  const home = `/${code}`

  const block = storeBlocks.find(b => b.order === Number(order))
  const completedBlock = block ? userProgress.completedBlocks.find(b => b.blockId === block.id) : undefined

  if (!block || !completedBlock) {
    return (
      <div className={`${card} p-8 text-center mt-6 max-w-xl mx-auto`}>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {!block ? 'Блок не знайдено' : 'Блок ще не завершено'}
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          {block && (
            <Link to={`${home}/block/${block.order}`} className={primaryBtn}>
              Пройти блок
            </Link>
          )}
          <Link to={home} className={secondaryBtn}>
            <HomeIcon className="h-5 w-5" /> На головну
          </Link>
        </div>
      </div>
    )
  }

  const score = completedBlock.score
  const mood = scoreMood(score)
  const nextBlock = [...storeBlocks].filter(b => b.order > block.order).sort((a, b) => a.order - b.order)[0]

  return (
    <div className="max-w-xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`${card} p-8 sm:p-10 text-center`}
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
          className="text-6xl"
          aria-hidden
        >
          {mood.emoji}
        </motion.div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{mood.uk}</h1>

        <div className="mt-8">
          <div className="text-6xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            {score}
            <span className="text-2xl text-zinc-400 dark:text-zinc-500">/10</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${score >= 7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
          <div className="font-medium">Блок завершено: {block.title}</div>
          <div className="text-sm opacity-80" lang={code}>{block.titleTarget}</div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {nextBlock && (
            <button onClick={() => navigate(`${home}/block/${nextBlock.order}`)} className={`${primaryBtn} py-3`} autoFocus>
              Наступний блок <ArrowRightIcon className="h-5 w-5" />
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => navigate(`${home}/block/${block.order}`)} className={secondaryBtn}>
              <ArrowPathIcon className="h-5 w-5" /> Пройти ще раз
            </button>
            <button onClick={() => navigate(home)} className={secondaryBtn}>
              <HomeIcon className="h-5 w-5" /> На головну
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
