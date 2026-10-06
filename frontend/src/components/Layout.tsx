import { Outlet, matchPath, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './Navbar'

/** Lesson/trainer screens render full-screen (they build their own header). */
function isFullScreen(pathname: string) {
  return !!(matchPath('/:lang/block/:order', pathname) || matchPath('/:lang/review', pathname))
}

export const Layout = () => {
  const { pathname } = useLocation()
  const full = isFullScreen(pathname)

  const page = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )

  if (full) return <div className="app-bg min-h-[100dvh] overflow-x-clip text-ink">{page}</div>

  return (
    <div className="app-bg min-h-[100dvh] overflow-x-clip text-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(6.5rem+var(--safe-bottom))] pt-4 sm:px-6 sm:pb-16 sm:pt-8">
        {page}
      </main>
    </div>
  )
}
