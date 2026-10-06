import { Link, useNavigate, useParams } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'
import { useLangProgress } from '../store/useStore'
import { useLang } from '../context/LangContext'
import { blockEmoji, blockTone } from '../theme/palette'
import { ResultScreen } from '../components/LessonKit'

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
      <div className="flex min-h-[60dvh] items-center justify-center px-4 py-10">
        <div className="card w-full max-w-sm p-8 text-center">
          <div className="text-5xl">{block ? '🔒' : '🔍'}</div>
          <p className="mt-3 font-display text-xl font-extrabold">{!block ? 'Блок не знайдено' : 'Блок ще не завершено'}</p>
          <div className="mt-6 flex flex-col gap-3">
            {block && (
              <Link to={`${home}/block/${block.order}`} className="btn btn-primary">
                Пройти блок
              </Link>
            )}
            <Link to={home} className="btn btn-secondary">
              <HomeIcon className="h-5 w-5" /> На головну
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const score = completedBlock.score
  const percent = score * 10
  const total = block.words.length
  const nextBlock = [...storeBlocks].filter(b => b.order > block.order).sort((a, b) => a.order - b.order)[0]
  const mistakes = block.words
    .filter(w => (userProgress.mistakes[w.id] || 0) > 0)
    .map(w => ({ id: w.id, translation: w.translation, term: w.term }))
  const date = new Date(completedBlock.completedAt)

  return (
    <ResultScreen
      percent={percent}
      score10={score}
      passed={score >= 7}
      title={block.title}
      subtitle={block.titleTarget}
      emoji={blockEmoji(block.title)}
      gradient={blockTone(block.order).gradient}
      lang={code}
      chips={[
        { icon: '🎯', label: 'Точність', value: `${percent}%` },
        { icon: '📅', label: 'Дата', value: isNaN(date.getTime()) ? '—' : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) },
        { icon: '📚', label: 'Слова', value: String(total) },
      ]}
      mistakes={mistakes}
      onNext={nextBlock ? () => navigate(`${home}/block/${nextBlock.order}`) : undefined}
      onRetry={() => navigate(`${home}/block/${block.order}`)}
      onHome={() => navigate(home)}
    />
  )
}
