import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

export default function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve ser utilizado dentro de ThemeProvider.')
  return context
}
