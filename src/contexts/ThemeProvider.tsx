import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import type { Theme } from '../types/theme'
import { ThemeContext } from './ThemeContext'

const storageKey = 'kairos.theme'
const parseTheme = (value: string | null): Theme => value === 'dark' ? 'dark' : 'light'

function initialTheme(): Theme {
  try { return parseTheme(localStorage.getItem(storageKey)) }
  catch { return parseTheme(document.documentElement.dataset.theme ?? null) }
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(initialTheme)
  const setTheme = useCallback((value: Theme) => {
    updateTheme(value)
    try { localStorage.setItem(storageKey, value) }
    catch { /* Keep the selected theme for this visit when storage is unavailable. */ }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#102019' : '#1b4d3e')
  }, [theme])

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return
      // Ignore sessionStorage events, which can use the same key.
      try { if (event.storageArea && event.storageArea !== localStorage) return }
      catch { return }
      updateTheme(parseTheme(event.newValue))
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
