import { vi } from 'vitest'
import { handleShelfFixture, makeShelfApiFixture } from './shelvesApiFixture'

export function installShelfApiMock() {
  const db = makeShelfApiFixture()
  const respond: typeof globalThis.fetch = async (input, init) => {
    const path = new URL(String(input)).pathname.replace('/api/v1', '')
    if (path === '/auth/login') return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' })
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    const result = handleShelfFixture(db, init?.method ?? 'GET', path, body)
    if (!result) return new Response(null, { status: 503 })
    return result.status === 204 ? new Response(null, { status: 204 }) : Response.json(result.json, { status: result.status })
  }
  const fetch = vi.fn<typeof globalThis.fetch>(respond)
  vi.stubGlobal('fetch', fetch)
  return { db, fetch, respond }
}
