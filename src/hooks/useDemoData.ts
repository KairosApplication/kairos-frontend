import { useEffect, useState } from 'react'

export default function useDemoData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    async function fetchDemo() {
      setLoading(true)
      setError(false)
      try {
        const value = await load()
        if (active) setData(value)
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchDemo()
    return () => { active = false }
  }, [load, attempt])
  return { data, loading, error, retry: () => setAttempt((value) => value + 1) }
}
