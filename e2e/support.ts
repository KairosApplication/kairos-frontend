import type { Page } from '@playwright/test'
import { managerPages } from '../src/routes/managerPages'
import { handleShelfFixture, makeShelfApiFixture } from '../src/test/shelvesApiFixture'

import { handleEmployees, makeEmployees } from '../src/test/employeesApiFixture'
import { handleRestocking, makeRestockingFixture } from '../src/test/restockingApiFixture'

export const panelPages = managerPages

// HTTP responses exist only inside browser tests. No production account or API is used.
export async function mockSession(page: Page, authenticated = true) {
  let signedIn = authenticated
  const db = Object.assign(makeShelfApiFixture(), { employees: makeEmployees() })
  const restocking = makeRestockingFixture()
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const headers = {
      'Access-Control-Allow-Origin': request.headers().origin ?? 'http://127.0.0.1:4175',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-TOKEN',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    }
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return }
    if (path === '/api/v1/auth/me') {
      await route.fulfill({ status: signedIn ? 200 : 401, headers, json: signedIn ? { email: 'gerente.acessibilidade@kairos.example', roles: ['MANAGER'] } : {} }); return
    }
    if (path === '/api/v1/auth/login' && request.method() === 'GET') {
      await route.fulfill({ headers, json: { headerName: 'X-CSRF-TOKEN', token: 'browser-test-csrf' } }); return
    }
    if (path === '/api/v1/auth/login' && request.method() === 'POST') {
      signedIn = true
      await route.fulfill({ headers, json: { accessToken: 'browser-test-access', tokenType: 'Bearer', expiresIn: 900 } }); return
    }
    if (path === '/api/v1/auth/logout') { signedIn = false; await route.fulfill({ status: 204, headers }); return }
    if (!signedIn) { await route.fulfill({ status: 401, headers }); return }
    const body = request.postData() ? request.postDataJSON() : undefined
    const data = handleEmployees(db, request.method(), path.replace('/api/v1', ''), body) ?? handleRestocking(restocking, request.method(), path.replace('/api/v1', ''), body) ?? handleShelfFixture(db, request.method(), path.replace('/api/v1', ''), body)
    if (data) {
      await route.fulfill({ status: data.status, headers, ...(data.json === undefined ? {} : { json: data.json }) }); return
    }
    await route.fulfill({ status: 503, headers, json: { message: 'No real API is available in this test.' } })
  })
  return db
}

export async function preferredTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => localStorage.setItem('kairos.theme', value), theme)
}
