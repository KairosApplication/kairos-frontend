import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearApiReads, setApiReadScope, sharedApiRead } from './apiReadCache'

beforeEach(() => { setApiReadScope('manager-a'); clearApiReads() })
afterEach(() => { setApiReadScope(null); vi.useRealTimers() })

it('shares concurrent reads and returns separate copies for each consumer', async () => {
  const load = vi.fn(async () => [{ id: 1 }])
  const [first, second] = await Promise.all([sharedApiRead('/employees/list', load), sharedApiRead('/employees/list', load)])
  expect(load).toHaveBeenCalledTimes(1)
  expect(first).toEqual(second)
  ;(first as { id: number }[])[0].id = 99
  expect(await sharedApiRead('/employees/list', load)).toEqual([{ id: 1 }])
})
it('expires successful reads after thirty seconds', async () => {
  vi.useFakeTimers(); vi.setSystemTime(0)
  const load = vi.fn(async () => [])
  await sharedApiRead('/store-map', load)
  vi.setSystemTime(29999); await sharedApiRead('/store-map', load)
  expect(load).toHaveBeenCalledTimes(1)
  vi.setSystemTime(30000); await sharedApiRead('/store-map', load)
  expect(load).toHaveBeenCalledTimes(2)
})
it('does not persist errors or cache auth, purchases or non-allowlisted endpoints', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue([])
  await expect(sharedApiRead('/customers/list', load)).rejects.toThrow('offline')
  await sharedApiRead('/customers/list', load)
  expect(load).toHaveBeenCalledTimes(2)
  for (const path of ['/auth/me', '/purchases/1/total']) {
    await sharedApiRead(path, load); await sharedApiRead(path, load)
  }
  expect(load).toHaveBeenCalledTimes(6)
})
it('cancels one reader without repeating or aborting the request used by another page', async () => {
  let finish!: (value: unknown) => void
  const load = vi.fn(() => new Promise(resolve => { finish = resolve }))
  const controller = new AbortController()
  const first = sharedApiRead('/restockings/list', load, controller.signal)
  const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
  await Promise.resolve(); controller.abort()
  const second = sharedApiRead('/restockings/list', load)
  finish([{ id: 1 }]); await rejected
  expect(await second).toEqual([{ id: 1 }])
  expect(load).toHaveBeenCalledTimes(1)
})
it('discards late responses and saved data when identity changes', async () => {
  let finish!: (value: unknown) => void
  const load = vi.fn(() => new Promise(resolve => { finish = resolve }))
  const old = sharedApiRead('/employees/list', load)
  const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
  await Promise.resolve(); setApiReadScope('manager-b'); finish(['old-user-data'])
  await rejected
  expect(await sharedApiRead('/employees/list', async () => ['new-user-data'])).toEqual(['new-user-data'])
  setApiReadScope(null); setApiReadScope('manager-b')
  expect(await sharedApiRead('/employees/list', async () => ['fresh-login'])).toEqual(['fresh-login'])
})
it('invalidates cached results for explicit refresh', async () => {
  const load = vi.fn(async () => [])
  await sharedApiRead('/inventories/list', load); clearApiReads()
  await sharedApiRead('/inventories/list', load)
  expect(load).toHaveBeenCalledTimes(2)
})
