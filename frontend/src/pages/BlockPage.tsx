import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchBlock, fetchBlocks } from '../services/api'
import { useStore } from '../store/useStore'
import type { Block } from '../data/blocks'
import { words } from '../data/words'

interface BlockTitle {
  uk: string
  es: string
}

const titles: Record<string, BlockTitle> = {
  'Базові привітання 1': {
    uk: 'Базові привітання 1',
    es: 'Saludos básicos 1'
  },
  'Базові привітання 2': {
    uk: 'Базові привітання 2',
    es: 'Saludos básicos 2'
  },
  'Базові слова 1': {
    uk: 'Базові слова 1',
    es: 'Palabras básicas 1'
  }
}

export function getBlockTitle(title: string): BlockTitle {
  return titles[title] || { uk: title, es: title }
}

export function BlockPage() {
  const { blockId } = useParams()
  const navigate = useNavigate()
  const { blocks: storeBlocks, userProgress, completeBlock } = useStore()
  const [block, setBlock] = useState<Block | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLearningMode, setIsLearningMode] = useState(true)
  const [isMultipleChoice, setIsMultipleChoice] = useState(false)
  const [showWordList, setShowWordList] = useState(true)
  const [score, setScore] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<Record<number, boolean>>({})
  const { addMistake, removeMistake } = useStore()

  useEffect(() => {
    async function loadData() {
      if (!blockId) return
      
      try {
        console.log('Loading data for block:', blockId)
        const blockResponse = await fetchBlock(parseInt(blockId))

        if (blockResponse.error) {
          console.error('Error loading block:', blockResponse.error)
          setError(blockResponse.error)
        } else if (blockResponse.data) {
          console.log('Loaded block:', blockResponse.data)
          setBlock(blockResponse.data)
        }
      } catch (error) {
        console.error('Error in loadData:', error)
        setError('Помилка завантаження даних')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [blockId])

  useEffect(() => {
    if (!blockId || !storeBlocks.length) return

    const currentBlockIndex = storeBlocks.findIndex(b => b.id === parseInt(blockId))
    if (currentBlockIndex === -1) return

    if (currentBlockIndex > 0) {
      const previousBlock = storeBlocks[currentBlockIndex - 1]
      const isPreviousBlockCompleted = userProgress.completedBlocks.some(
        block => block.id === previousBlock.id
      )
      if (!isPreviousBlockCompleted) {
        navigate(`/block/${previousBlock.id}`)
      }
    }
  }, [blockId, storeBlocks, userProgress.completedBlocks, navigate])

  const normalizeAnswer = (answer: string): string[] => {
    // Видаляємо всі знаки пунктуації та пробіли
    const cleanAnswer = answer
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Нормалізуємо акценти
    const normalized = cleanAnswer
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    // Зберігаємо версію з акцентами
    const withAccents = cleanAnswer
      .replace(/[^a-z0-9áéíóúñü\s]/g, '')

    return [normalized, withAccents]
  }

  const getRandomOptions = (correctWord: string, allWords: typeof words) => {
    const options = [correctWord]
    const otherWords = allWords.filter(w => w.spanish !== correctWord)
    
    while (options.length < 4) {
      const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!options.includes(randomWord.spanish)) {
        options.push(randomWord.spanish)
      }
    }
    
    return options.sort(() => Math.random() - 0.5)
  }

  const handleMultipleChoice = (selectedAnswer: string) => {
    if (!block) return

    const currentWord = words.find(w => w.id === block.words[currentWordIndex])
    if (!currentWord) return

    const isCorrect = normalizeAnswer(selectedAnswer).some(user => 
      normalizeAnswer(currentWord.spanish).some(correct => user === correct)
    )

    // Зберігаємо відповідь
    const newAnswers = {
      ...answers,
      [currentWord.id]: selectedAnswer
    }
    setAnswers(newAnswers)

    if (isCorrect) {
      if (currentWordIndex < block.words.length - 1) {
        setCurrentWordIndex(prev => prev + 1)
      } else {
        // Якщо всі відповіді правильні, переходимо до тесту з введенням
        setIsLearningMode(false)
        setCurrentWordIndex(0)
        setUserInput('')
      }
    } else {
      // Якщо неправильно, показуємо повідомлення і залишаємось на цьому слові
      setFeedback({
        ...feedback,
        [currentWord.id]: false
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!block) return

    const currentWord = words.find(w => w.id === block.words[currentWordIndex])
    if (!currentWord) return

    // Зберігаємо відповідь
    const newAnswers = {
      ...answers,
      [currentWord.id]: userInput
    }
    setAnswers(newAnswers)

    // Перевіряємо чи це останнє питання
    if (currentWordIndex < block.words.length - 1) {
      // Якщо не останнє - переходимо до наступного
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
    } else {
      // Якщо останнє - перевіряємо всі відповіді
      let totalScore = 0
      const newFeedback: Record<number, boolean> = {}

      // Перевіряємо всі відповіді
      block.words.forEach(wordId => {
        const word = words.find(w => w.id === wordId)
        if (!word) return

        const answer = newAnswers[wordId] || ''
        const normalizedUserInput = normalizeAnswer(answer)
        const normalizedCorrectAnswer = normalizeAnswer(word.spanish)
        
        const isCorrect = normalizedUserInput.some(user => 
          normalizedCorrectAnswer.some(correct => user === correct)
        )

        newFeedback[wordId] = isCorrect

        if (isCorrect) {
          removeMistake(word.id)
          totalScore++
        } else {
          addMistake(word)
        }
      })

      // Оновлюємо стан з результатами
      setFeedback(newFeedback)
      setScore(totalScore)
      const percentage = (totalScore / block.words.length) * 100

      // Перевіряємо чи блок пройдено
      if (percentage >= 70) {
        // Конвертуємо відсоток у 10-бальну шкалу
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
        completeBlock(block.id, finalScore)
      }
      setShowCompletion(true)
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  if (error || !block) {
    return <div className="text-red-500">{error || 'Блок не знайдено'}</div>
  }

  const currentWord = words.find(w => w.id === block.words[currentWordIndex])
  if (!currentWord) {
    return <div className="text-red-500">Слово не знайдено</div>
  }

  if (showCompletion) {
    const percentage = (score / block.words.length) * 100
    const currentBlockIndex = storeBlocks.findIndex(b => b.id === block.id)
    const hasNextBlock = currentBlockIndex < storeBlocks.length - 1

    // Конвертуємо відсоток у 10-бальну шкалу
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

    const handleNextBlock = () => {
      if (hasNextBlock) {
        const nextBlockId = storeBlocks[currentBlockIndex + 1].id
        setCurrentWordIndex(0)
        setScore(0)
        setShowCompletion(false)
        setUserInput('')
        setAnswers({})
        setFeedback({})
        setIsLearningMode(true)
        setIsMultipleChoice(false)
        setShowWordList(true)
        navigate(`/block/${nextBlockId}`)
      }
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-4">
            {percentage >= 70 ? (
              <>
                <div>Чудово!</div>
                <div className="text-sm text-gray-500">¡Excelente!</div>
              </>
            ) : (
              <>
                <div>Потрібно ще попрацювати</div>
                <div className="text-sm text-gray-500">Necesitas practicar más</div>
              </>
            )}
          </h2>
          <p className="text-lg mb-4">Бал: {score}/{block.words.length} ({percentage.toFixed(1)}%)</p>
          <p className="text-sm text-gray-500">Puntuación: {score}/{block.words.length} ({percentage.toFixed(1)}%)</p>
          <p className="text-lg mb-4">Середній бал: {finalScore}</p>
          <p className="text-sm text-gray-500">Nota media: {finalScore}</p>
          
          <div className="mt-6 space-y-4">
            {block.words.map((wordId, index) => {
              const word = words.find(w => w.id === wordId)
              if (!word) return null
              const answer = answers[wordId] || ''
              const isCorrect = normalizeAnswer(answer).some(user => 
                normalizeAnswer(word.spanish).some(correct => user === correct)
              )
              return (
                <div key={`answer-${wordId}-${index}`} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="font-medium">{word.ukrainian}</p>
                  <p className="text-gray-600">Ваша відповідь: {answer}</p>
                  {!isCorrect && <p className="text-green-600">Правильна відповідь: {word.spanish}</p>}
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-4">
            {percentage >= 70 ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  <div>На головну</div>
                  <div className="text-sm">Ir al inicio</div>
                </button>
                {hasNextBlock && (
                  <button
                    onClick={handleNextBlock}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <div>До наступного блоку</div>
                    <div className="text-sm">Ir al siguiente bloque</div>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  setCurrentWordIndex(0)
                  setScore(0)
                  setShowCompletion(false)
                  setUserInput('')
                  setAnswers({})
                  setFeedback({})
                  setIsLearningMode(true)
                  setIsMultipleChoice(false)
                  setShowWordList(true)
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <div>Спробувати ще раз</div>
                <div className="text-sm">Intentar de nuevo</div>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLearningMode) {
    const blockTitle = getBlockTitle(block.title)
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          <div className="text-gray-900 dark:text-dark-text">{blockTitle.uk}</div>
          <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{blockTitle.es}</div>
        </h1>
        
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm">
          {showWordList ? (
            <>
              <div className="space-y-6">
                {block.words.map((wordId) => {
                  const word = words.find(w => w.id === wordId)
                  if (!word) return null
                  return (
                    <div key={word.id} className="border-b dark:border-dark-border pb-4 last:border-b-0">
                      <p className="font-medium text-gray-900 dark:text-dark-text">{word.ukrainian}</p>
                      <p className="text-gray-600 dark:text-dark-text-secondary">{word.spanish}</p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  setShowWordList(false)
                  setIsMultipleChoice(true)
                  setCurrentWordIndex(0)
                }}
                className="w-full mt-6 bg-blue-500 dark:bg-dark-accent text-white py-2 rounded-md hover:bg-blue-600 dark:hover:bg-dark-accent-hover"
              >
                <div>Почати тест</div>
                <div className="text-sm">Comenzar prueba</div>
              </button>
            </>
          ) : isMultipleChoice ? (
            <>
              <div className="mb-6">
                <div className="text-gray-600 mb-2">Українська:</div>
                <div className="text-xl font-medium">{currentWord.ukrainian}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {getRandomOptions(currentWord.spanish, words).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleMultipleChoice(option)}
                    className="p-4 text-lg border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-gray-900 bg-white"
                  >
                    {option}
                  </button>
                ))}
              </div>

              {feedback[currentWord.id] === false && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                  <div>Спробуйте ще раз</div>
                  <div className="text-sm">Inténtalo de nuevo</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-6">
              <h2 className="text-xl font-bold mb-4">
                <div>Чудово! Тепер спробуємо написати слова самостійно</div>
                <div className="text-sm text-gray-500">¡Excelente! Ahora intentemos escribir las palabras por nuestra cuenta</div>
              </h2>
              <button
                onClick={() => {
                  setIsLearningMode(false)
                  setCurrentWordIndex(0)
                  setUserInput('')
                }}
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <div>Почати тест</div>
                <div className="text-sm">Comenzar prueba</div>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const blockTitle = getBlockTitle(block.title)
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        <div className="text-gray-900 dark:text-dark-text">{blockTitle.uk}</div>
        <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{blockTitle.es}</div>
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="mb-4">
          <div className="text-gray-600 mb-2">Українська:</div>
          <div className="text-xl font-medium">{currentWord.ukrainian}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="answer" className="block text-gray-600 mb-2">
              Іспанська:
            </label>
            <input
              type="text"
              id="answer"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
              placeholder="Введіть відповідь..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            <div>{currentWordIndex < block.words.length - 1 ? 'Наступне слово' : 'Завершити'}</div>
            <div className="text-sm">{currentWordIndex < block.words.length - 1 ? 'Siguiente palabra' : 'Finalizar'}</div>
          </button>
        </form>

        <div className="mt-4 text-center text-gray-600">
          <div>Слово {currentWordIndex + 1} з {block.words.length}</div>
          <div className="text-sm text-gray-500">Palabra {currentWordIndex + 1} de {block.words.length}</div>
        </div>
      </div>
    </div>
  )
} 