import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { normalizeAnswer } from '../utils/normalize'
import { fetchBlock } from '../services/api'
import type { Word } from '../data/words'
import type { Block } from '../data/blocks'
import { words } from '../data/words'

interface BlockWithWords extends Omit<Block, 'words'> {
  words: Word[]
}

type Phase = 'intro' | 'quiz' | 'input' | 'completion'

export function Assessment() {
  const { blockId } = useParams()
  const navigate = useNavigate()
  const [block, setBlock] = useState<BlockWithWords | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<Record<number, boolean>>({})
  const [phase, setPhase] = useState<Phase>('intro')
  const [score, setScore] = useState(0)
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const { addMistake, removeMistake } = useStore()

  useEffect(() => {
    async function loadBlock() {
      if (!blockId) return
      
      try {
        const response = await fetchBlock(parseInt(blockId))
        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          const blockWithWords: BlockWithWords = {
            ...response.data,
            words: response.data.words.map(wordId => 
              words.find(w => w.id === wordId)
            ).filter((word): word is Word => word !== undefined)
          }
          setBlock(blockWithWords)
        }
      } catch {
        setError('Помилка завантаження блоку')
      } finally {
        setLoading(false)
      }
    }

    loadBlock()
  }, [blockId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!block) return

    const currentWord = block.words[currentWordIndex]
    if (!currentWord) return

    // Зберігаємо відповідь
    const newAnswers = {
      ...answers,
      [currentWord.id]: userInput
    }
    setAnswers(newAnswers)

    // Завжди переходимо до наступного питання, якщо воно є
    if (currentWordIndex < block.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
    } else {
      // Тільки після останнього питання перевіряємо всі відповіді
      let totalScore = 0
      const newFeedback: Record<number, boolean> = {}

      block.words.forEach(word => {
        const answer = newAnswers[word.id] || ''
        const normalizedUserInput = normalizeAnswer(answer)
        const normalizedCorrectAnswer = normalizeAnswer(word.spanish)
        
        const isCorrect = normalizedUserInput.some(user => 
          normalizedCorrectAnswer.some(correct => user === correct)
        )

        newFeedback[word.id] = isCorrect

        if (isCorrect) {
          removeMistake(word.id)
          totalScore++
        } else {
          addMistake(word)
        }
      })

      setFeedback(newFeedback)
      setScore(totalScore)
      const percentage = (totalScore / block.words.length) * 100

      if (percentage >= 70) {
        const store = useStore.getState()
        let finalScore = 0
        if (percentage === 100) {
          finalScore = 10
        } else if (percentage >= 90) {
          finalScore = 9
        } else if (percentage >= 80) {
          finalScore = 8
        } else if (percentage >= 70) {
          finalScore = 7
        } else if (percentage >= 60) {
          finalScore = 6
        } else if (percentage >= 50) {
          finalScore = 5
        } else if (percentage >= 40) {
          finalScore = 4
        } else if (percentage >= 30) {
          finalScore = 3
        } else if (percentage >= 20) {
          finalScore = 2
        } else {
          finalScore = 1
        }
        store.completeBlock(block.id, finalScore)
      }
      setPhase('completion')
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  if (error || !block) {
    return <div className="text-red-500">{error || 'Блок не знайдено'}</div>
  }

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Слова для вивчення</h2>
          <div className="space-y-4">
            {block.words.map(word => (
              <div key={word.id} className="p-4 border rounded-lg">
                <div className="font-medium">{word.ukrainian}</div>
                <div className="text-gray-600">{word.spanish}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPhase('quiz')}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Почати тест
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'completion') {
    const percentage = (score / block.words.length) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-4">
            <div>{percentage >= 70 ? 'Відмінно!' : 'Потрібно ще попрацювати'}</div>
            <div className="text-sm text-gray-500">{percentage >= 70 ? '¡Excelente!' : 'Necesitas practicar más'}</div>
          </h2>
          <p className="text-lg mb-4">Бал: {score}/{block.words.length} ({percentage.toFixed(1)}%)</p>
          <p className="text-sm text-gray-500">Puntuación: {score}/{block.words.length} ({percentage.toFixed(1)}%)</p>
          
          <div className="mt-6 space-y-4">
            {block.words.map(word => {
              const isCorrect = feedback[word.id]
              const userAnswer = answers[word.id] || ''
              return (
                <div key={word.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="font-medium">{word.ukrainian}</div>
                  <div className="text-sm text-gray-500">{word.spanish}</div>
                  <div className="text-sm mt-1">
                    {isCorrect ? 'Правильно' : 'Неправильно'}
                    <span className="text-gray-500 ml-2">
                      {isCorrect ? 'Correcto' : 'Incorrecto'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="text-sm mt-1 text-gray-600">
                      Ваша відповідь: {userAnswer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <div>Повернутися на головну</div>
            <div className="text-sm">Volver al inicio</div>
          </button>
        </div>
      </div>
    )
  }

  const currentWord = block.words[currentWordIndex]
  if (!currentWord) {
    return <div className="text-red-500">Слово не знайдено</div>
  }

  if (phase === 'quiz') {
    // Генеруємо варіанти відповідей
    const options = [currentWord.spanish]
    while (options.length < 4) {
      const randomWord = words[Math.floor(Math.random() * words.length)]
      if (!options.includes(randomWord.spanish)) {
        options.push(randomWord.spanish)
      }
    }
    // Перемішуємо варіанти
    const shuffledOptions = options.sort(() => Math.random() - 0.5)

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-4">
            <div className="text-gray-600 mb-2">Українська:</div>
            <div className="text-xl font-medium">{currentWord.ukrainian}</div>
          </div>

          {quizFeedback && (
            <div className={`mb-4 p-3 rounded-lg ${quizFeedback.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {quizFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  if (option === currentWord.spanish) {
                    setSelectedOption(option)
                    setQuizFeedback({
                      correct: true,
                      message: 'Правильно! ¡Correcto!'
                    })
                    setTimeout(() => {
                      if (currentWordIndex < block.words.length - 1) {
                        setCurrentWordIndex(prev => prev + 1)
                        setQuizFeedback(null)
                        setSelectedOption(null)
                      } else {
                        setPhase('input')
                        setCurrentWordIndex(0) // Скидаємо індекс для фази input
                      }
                    }, 1000)
                  } else {
                    setSelectedOption(option)
                    setQuizFeedback({
                      correct: false,
                      message: `Неправильно. Правильна відповідь: ${currentWord.spanish}`
                    })
                  }
                }}
                style={{ outline: 'none' }}
                className={`p-4 rounded-lg bg-white/50 shadow-sm hover:shadow-md transition-shadow text-gray-800 font-medium border border-gray-100 ${
                  selectedOption === option ? 'bg-gray-100' : ''
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="mb-4">
          <div className="text-gray-600 mb-2">Українська:</div>
          <div className="text-xl font-medium">{currentWord.ukrainian}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-gray-600 mb-2">
              Введіть слово іспанською:
            </label>
            <input
              type="text"
              id="answer"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white/50 shadow-sm text-gray-800 font-medium text-lg"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Далі
          </button>
        </form>
      </div>
    </div>
  )
} 