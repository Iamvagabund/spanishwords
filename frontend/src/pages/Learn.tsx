import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { fetchBlock } from '../services/api'
import type { Word } from '../types/word'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '../utils/sound'

export default function Learn() {
  const [currentBlock, setCurrentBlock] = useState(1)
  const [words, setWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { userProgress, completeBlock } = useStore()

  useEffect(() => {
    loadBlock()
  }, [currentBlock])

  const loadBlock = async () => {
    try {
      setLoading(true)
      const response = await fetchBlock(currentBlock)
      if (response.error) {
        throw new Error(response.error)
      }
      if (!response.data) {
        throw new Error('No data received')
      }
      const blockWords = response.data.words.map(id => words.find(w => w.id === id)).filter((w): w is Word => w !== undefined)
      setWords(blockWords)
      setError(null)
    } catch (err) {
      setError('Помилка завантаження блоку')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    const score = Math.round((currentWordIndex / words.length) * 10)
    completeBlock(currentBlock, score)
    soundManager.play('success')
    if (currentBlock % 2 === 0) {
      soundManager.play('complete')
    }
    setCurrentBlock(prev => prev + 1)
  }

  const handleNextBlock = () => {
    setCurrentBlock(prev => prev + 1)
    setCurrentWordIndex(0)
    setShowTranslation(false)
  }

  const handlePrevBlock = () => {
    setCurrentBlock(prev => Math.max(1, prev - 1))
    setCurrentWordIndex(0)
    setShowTranslation(false)
  }

  const handleStartAssessment = () => {
    navigate(`/assessment/${currentBlock}`)
  }

  const handleNextWord = () => {
    setShowTranslation(false)
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
    }
  }

  const handlePrevWord = () => {
    setShowTranslation(false)
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1)
    }
  }

  const currentWord = words[currentWordIndex]
  const progress = (currentWordIndex / words.length) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Завантаження...
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl text-red-600"
        >
          {error}
        </motion.div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl"
        >
          Блок завершено!
        </motion.div>
      </div>
    )
  }

  const showAssessmentButton = currentBlock % 2 === 0 && !userProgress.completedBlocks.some(b => b.id === currentBlock)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Блок {currentBlock}</h1>
            <div className="mt-2 h-2 bg-gray-200 rounded-full w-48">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="space-x-4">
            <button
              onClick={handlePrevBlock}
              disabled={currentBlock === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
            >
              Попередній блок
            </button>
            <button
              onClick={handleNextBlock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Наступний блок
            </button>
          </div>
        </div>

        {showAssessmentButton && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-2">Час для контрольної роботи!</h2>
            <p className="text-gray-600 mb-4">
              Ви завершили два блоки. Давайте перевіримо ваші знання.
            </p>
            <button
              onClick={handleStartAssessment}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Почати контрольну роботу
            </button>
          </motion.div>
        )}

        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md bg-white rounded-lg shadow-lg p-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">{currentWord.word}</h2>
                <AnimatePresence>
                  {showTranslation && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xl text-gray-600"
                    >
                      {currentWord.translation}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-center space-x-4">
                {!showTranslation ? (
                  <button
                    onClick={() => setShowTranslation(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Показати переклад
                  </button>
                ) : (
                  <div className="space-x-4">
                    <button
                      onClick={handlePrevWord}
                      disabled={currentWordIndex === 0}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleNextWord}
                      disabled={currentWordIndex === words.length - 1}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Далі
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center text-gray-500">
                Слово {currentWordIndex + 1} з {words.length}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={handleComplete}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Завершити блок
        </button>
      </div>
    </div>
  )
} 