import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStats } from '../services/api'
import { useStore } from '../store/useStore'
import { Container } from '../components/Container'

export function StatsPage() {
  const { userProgress } = useStore()

  const totalScore = userProgress.completedBlocks.reduce((sum, block) => sum + block.score, 0)

  return (
    <Container>
      <h1 className="text-3xl font-bold mb-6">
        <div>Статистика</div>
        <div className="text-sm text-gray-500">Estadísticas</div>
      </h1>
      <div className="text-lg mb-4">
        <div>Відстежуйте свій прогрес</div>
        <div className="text-sm text-gray-500">Sigue tu progreso</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">
            <div>Загальна статистика</div>
            <div className="text-sm text-gray-500">Estadísticas generales</div>
          </h2>
          <div className="text-gray-600 dark:text-gray-300">
            <div>Завершено блоків: {userProgress.completedBlocks.length}</div>
            <div className="text-sm text-gray-500">Bloques completados: {userProgress.completedBlocks.length}</div>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <div>Середній бал: {userProgress.averageScore}</div>
            <div className="text-sm text-gray-500">Nota media: {userProgress.averageScore}</div>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <div>Сума балів: {totalScore}</div>
            <div className="text-sm text-gray-500">Puntuación total: {totalScore}</div>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <div>Помилок: {userProgress.mistakes.length}</div>
            <div className="text-sm text-gray-500">Errores: {userProgress.mistakes.length}</div>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <div>Поточний рівень: {userProgress.currentLevel}</div>
            <div className="text-sm text-gray-500">Nivel actual: {userProgress.currentLevel}</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">
            <div>Останні результати</div>
            <div className="text-sm text-gray-500">Últimos resultados</div>
          </h2>
          {userProgress.completedBlocks.slice(-5).map((block, index) => (
            <div key={`block-${block.id}-${index}`} className="mb-2">
              <div className="text-gray-600 dark:text-gray-300">
                <div>Блок {block.id} - {block.score} балів</div>
                <div className="text-sm text-gray-500">Bloque {block.id} - {block.score} puntos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {userProgress.mistakes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">
            <div>Слова з помилками</div>
            <div className="text-sm text-gray-500">Palabras con errores</div>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {userProgress.mistakes.map((word, index) => (
              <div
                key={`mistake-${word.id}-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold">{word.spanish}</div>
                <div className="text-gray-600">{word.ukrainian}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
} 