import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'

import { soundManager } from '../utils/sound'
import { useNavigate } from 'react-router-dom'
import type { Word } from '../types'

export default function Repeat() {
  const { words, userProgress } = useStore()
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const learnedWords = userProgress.learnedWords.map(id => parseInt(id))
    const availableWords = words.filter(word => learnedWords.includes(word.id))
    if (availableWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      setCurrentWord(availableWords[randomIndex])
    }
  }, [words, userProgress.learnedWords])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord) return

    const isAnswerCorrect = answer.toLowerCase() === currentWord.spanish.toLowerCase()
    setIsCorrect(isAnswerCorrect)
    setFeedback(isAnswerCorrect ? 'Правильно!' : `Неправильно. Правильна відповідь: ${currentWord.spanish}`)
    setShowTranslation(true)

    if (isAnswerCorrect) {
      soundManager.play('correct')
    } else {
      soundManager.play('wrong')
    }
  }

  const handleNext = () => {
    if (!currentWord) return

    const learnedWords = userProgress.learnedWords.map(id => parseInt(id))
    const availableWords = words.filter(word => learnedWords.includes(word.id))
    if (availableWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      setCurrentWord(availableWords[randomIndex])
    }
    setAnswer('')
    setFeedback('')
    setIsCorrect(null)
    setShowTranslation(false)
  }

  if (!currentWord) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Повторення слів</h1>
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <p className="text-xl mb-4">{currentWord.ukrainian}</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              placeholder="Введіть слово іспанською"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Перевірити
            </button>
          </form>
          {feedback && (
            <div className={`mt-4 p-4 rounded ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              {feedback}
            </div>
          )}
          {isCorrect !== null && (
            <button
              onClick={handleNext}
              className="w-full mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Наступне слово
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 