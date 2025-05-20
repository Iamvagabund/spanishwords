import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlockProgress } from '../components/BlockProgress'
import { fetchBlocks } from '../services/api'
import { useStore } from '../store/useStore'

export default function Home() {
  const { blocks } = useStore()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Вітаємо!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map(block => (
          <div key={block.id} className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Блок {block.id}</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Слів: {block.words.length}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 