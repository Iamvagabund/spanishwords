import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:pb-12 sm:pt-10">
        <Outlet />
      </main>
    </div>
  )
}
