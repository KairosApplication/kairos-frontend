// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import useApiData from './useApiData'
import { ApiHttpError } from '../services/apiData'
import TestSession from '../test/TestSession'

afterEach(cleanup)

it.each([401, 403])('revalidates session only for 401, preserving a resource-specific %s error', async status => {
  const refreshSession = vi.fn().mockResolvedValue(undefined)
  const loader = vi.fn().mockRejectedValue(new ApiHttpError(status))
  const wrapper = ({ children }: { children: ReactNode }) => <TestSession refreshSession={refreshSession}>{children}</TestSession>
  const { result } = renderHook(() => useApiData(loader), { wrapper })
  await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiHttpError))
  expect(result.current.data).toBeNull()
  expect(refreshSession).toHaveBeenCalledTimes(status === 401 ? 1 : 0)
})

it('aborts outdated reads and ignores a late response after retry or unmount', async () => {
  const pending: { signal: AbortSignal; resolve: (value: string) => void }[] = []
  const loader = (signal?: AbortSignal) => new Promise<string>(resolve => pending.push({ signal: signal!, resolve }))
  const { result, unmount } = renderHook(() => useApiData(loader), { wrapper: TestSession })
  await waitFor(() => expect(pending).toHaveLength(1))
  act(() => { void result.current.reload() })
  await waitFor(() => expect(pending).toHaveLength(2))
  expect(pending[0].signal.aborted).toBe(true)
  await act(async () => { pending[1].resolve('latest') })
  expect(result.current.data).toBe('latest')
  await act(async () => { pending[0].resolve('stale') })
  expect(result.current.data).toBe('latest')
  unmount()
  expect(pending[1].signal.aborted).toBe(true)
})
