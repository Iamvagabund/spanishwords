import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useEffect, useState } from 'react'

export const Layout = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
    }
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
} 