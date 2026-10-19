import { createContext } from 'react'
import type { Theme } from '../types/theme'

export const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | undefined>(undefined)
