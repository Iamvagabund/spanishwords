import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Container } from './Container'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Navbar />
      <Container>
        <main className="py-8">
          <Outlet />
        </main>
      </Container>
    </div>
  )
} 