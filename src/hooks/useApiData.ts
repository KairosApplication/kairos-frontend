import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiHttpError } from '../services/apiData'
import { useAuth } from './useAuth'
import { clearApiReads } from '../services/apiReadCache'

export default function useApiData<T>(loader: (signal?: AbortSignal) => Promise<T>) {
  const { refreshSession } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const request = useRef<AbortController | null>(null)
  const fail = useCallback((cause: unknown) => {
    request.current?.abort()
    setData(null)
    setError(cause instanceof Error ? cause : new Error('Não foi possível consultar os dados.'))
    if (cause instanceof ApiHttpError && cause.status === 401) void refreshSession()
  }, [refreshSession])
  const load = useCallback((controller: AbortController) => Promise.resolve()
    .then(() => loader(controller.signal))
    .then(next => {
      if (!controller.signal.aborted) { setData(next); return next }
    })
    .catch((cause: unknown) => { if (!controller.signal.aborted) fail(cause) }), [loader, fail])
  const reload = useCallback(async () => {
    clearApiReads()
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setData(null); setError(null)
    return load(controller)
  }, [load])
  useEffect(() => {
    const controller = new AbortController()
    request.current = controller
    void load(controller)
    return () => request.current?.abort()
  }, [load])
  return { data, error, reload, fail }
}
