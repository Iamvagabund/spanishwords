import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  console.log('ThemeProvider: Initializing')
  
  // Ініціалізуємо тему з localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    console.log('ThemeProvider: Initial theme from localStorage:', savedTheme || 'light')
    return savedTheme || 'light'
  })

  // Функція для перемикання теми
  const toggleTheme = () => {
    console.log('ThemeProvider: Toggle theme called, current theme:', theme)
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      console.log('ThemeProvider: Setting new theme to:', newTheme)
      return newTheme
    })
  }

  // Ефект для застосування теми
  useEffect(() => {
    console.log('ThemeProvider: Theme effect triggered, applying theme:', theme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const value = {
    theme,
    toggleTheme
  }

  console.log('ThemeProvider: Rendering with theme:', theme)

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 