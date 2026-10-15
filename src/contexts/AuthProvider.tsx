import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import * as authService from '../services/authService'
import type { LoginCredentials } from '../types/auth'
import { AuthContext } from './AuthContext'
import { authReducer, initialAuthState } from './authReducer'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível verificar seu acesso. Tente novamente.'
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const { pathname } = useLocation()
  const revision = useRef(0)
  const mutationPending = useRef(false)
  const wasAuthenticated = useRef(false)
  const refreshPending = useRef<Promise<void> | null>(null)
  const refreshController = useRef<AbortController | null>(null)

  const cancelRefresh = useCallback(() => {
    revision.current += 1
    refreshController.current?.abort()
    refreshController.current = null
    refreshPending.current = null
  }, [])

  const refreshSession = useCallback((): Promise<void> => {
    if (mutationPending.current) return Promise.resolve()
    if (refreshPending.current) return refreshPending.current
    const operation = ++revision.current
    const controller = new AbortController()
    refreshController.current = controller
    dispatch({ type: 'CHECK_STARTED' })
    const pending = (async () => {
      try {
        const user = await authService.getSession(controller.signal)
        if (operation !== revision.current) return
        if (user) {
          wasAuthenticated.current = true
          dispatch({ type: 'SESSION_FOUND', user })
        } else {
          const reason = wasAuthenticated.current ? 'expired' : null
          wasAuthenticated.current = false
          dispatch({ type: 'SESSION_MISSING', reason })
        }
      } catch (error: unknown) {
        if (operation !== revision.current) return
        if (error instanceof authService.AccessDeniedError) {
          wasAuthenticated.current = false
          dispatch({ type: 'SESSION_MISSING', reason: 'forbidden' })
        } else {
          dispatch({ type: 'CHECK_FAILED', error: errorMessage(error) })
        }
      } finally {
        if (operation === revision.current) {
          refreshPending.current = null
          refreshController.current = null
        }
      }
    })()
    refreshPending.current = pending
    return pending
  }, [])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    if (mutationPending.current) throw new Error('Aguarde a operação de acesso em andamento.')
    mutationPending.current = true
    cancelRefresh()
    try {
      const user = await authService.login(credentials)
      wasAuthenticated.current = true
      dispatch({ type: 'SESSION_FOUND', user })
    } finally {
      mutationPending.current = false
    }
  }, [cancelRefresh])

  const signOut = useCallback(async () => {
    if (mutationPending.current) return
    mutationPending.current = true
    cancelRefresh()
    dispatch({ type: 'SIGN_OUT_STARTED' })
    try {
      await authService.logout()
      wasAuthenticated.current = false
      dispatch({ type: 'SESSION_MISSING', reason: 'signed-out' })
    } catch (error: unknown) {
      dispatch({ type: 'SIGN_OUT_FAILED', error: errorMessage(error) })
    } finally {
      mutationPending.current = false
    }
  }, [cancelRefresh])

  useEffect(() => {
    void refreshSession()
  }, [pathname, refreshSession])

  useEffect(() => {
    function revalidate() {
      if (document.visibilityState === 'visible' && wasAuthenticated.current) void refreshSession()
    }
    window.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    return () => {
      window.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
      cancelRefresh()
    }
  }, [cancelRefresh, refreshSession])

  const value = useMemo(() => ({ state, signIn, signOut, refreshSession }), [state, signIn, signOut, refreshSession])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
