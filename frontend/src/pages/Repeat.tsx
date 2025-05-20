import { useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'

import { soundManager } from '../utils/sound'
import { useNavigate } from 'react-router-dom'

export default function Repeat() {
  const mistakes = useStore((state) => state.userProgress.mistakes)
  const removeMistake = useStore((state) => state.removeMistake)
  const [isPracticing, setIsPracticing] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const navigate = useNavigate()

  // Отримуємо слова з помилками
  const mistakeWords = Object.keys(mistakes).map(wordId => {
    const word = useStore.getState().words.find(w => w.id === Number(wordId))
    return word
  }).filter(Boolean)

  // Якщо немає помилок, показуємо повідомлення
  if (mistakeWords.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Немає слів для повторення</h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-8">Ви не зробили жодної помилки</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-dark-accent dark:hover:bg-dark-accent-hover text-white px-6 py-2 rounded-md"
        >
          Повернутися на головну
        </button>
      </div>
    )
  }

  if (!isPracticing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Повторення</h1>
          <button
            onClick={() => {
              setIsPracticing(true)
              setCurrentWordIndex(0)
              setUserAnswer('')
              setIsCorrect(null)
              setShowTranslation(false)
              soundManager.play('click')
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Пройти слова
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mistakeWords.map((word) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Рівень {word.level}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">{word.spanish}</h3>
                  <p className="text-lg text-gray-600">{word.ukrainian}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const currentWord = mistakeWords[currentWordIndex]

  if (!currentWord) {
    setIsPracticing(false)
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentWord) return

    const isAnswerCorrect = userAnswer.toLowerCase() === currentWord.spanish.toLowerCase()
    setIsCorrect(isAnswerCorrect)
    setShowTranslation(true)

    if (isAnswerCorrect) {
      removeMistake(currentWord.id)
      soundManager.play('correct')
    } else {
      soundManager.play('wrong')
    }
  }

  const handleNext = () => {
    if (currentWordIndex < mistakeWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setUserAnswer('')
      setIsCorrect(null)
      setShowTranslation(false)
    } else {
      setIsPracticing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Повторення</h1>
        <button
          onClick={() => setIsPracticing(false)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Повернутися до списку
        </button>
      </div>

      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md bg-white rounded-lg shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{currentWord.ukrainian}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Введіть слово іспанською"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={showTranslation}
              />
              {!showTranslation && (
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-sm hover:shadow-md"
                >
                  Перевірити
                </button>
              )}
            </form>
          </div>

          {showTranslation && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className={`text-lg font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? 'Правильно!' : 'Неправильно!'}
              </p>
              <p className="mt-2 text-gray-700">
                Правильна відповідь: <span className="font-bold text-gray-900">{currentWord.spanish}</span>
              </p>
              <button
                onClick={handleNext}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium shadow-sm hover:shadow-md"
              >
                {currentWordIndex < mistakeWords.length - 1 ? 'Наступне слово' : 'Завершити'}
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-gray-500">
            Слово {currentWordIndex + 1} з {mistakeWords.length}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 