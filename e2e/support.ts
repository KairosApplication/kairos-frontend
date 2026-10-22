import type { Page } from '@playwright/test'
import { managerPages } from '../src/routes/managerPages'

export const panelPages = managerPages

// HTTP responses exist only inside browser tests. No production account or API is used.
export async function mockSession(page: Page, authenticated = true) {
  let signedIn = authenticated
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const headers = {
      'Access-Control-Allow-Origin': request.headers().origin ?? 'http://127.0.0.1:4175',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-TOKEN',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    await route.fulfill({ status: 503, headers, json: { message: 'No real API is available in this test.' } })
  })
}

export async function preferredTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => localStorage.setItem('kairos.theme', value), theme)
}
