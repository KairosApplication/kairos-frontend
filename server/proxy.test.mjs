import assert from 'node:assert/strict'
import { test } from 'node:test'
import http from 'node:http'
import { once } from 'node:events'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createApp, upstreamOrigin } from './proxy.mjs'

const origin = 'https://frontend.example.test'
async function start(server) {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return `http://127.0.0.1:${server.address().port}`
}
async function setup(t, { chat = true, timeout = 130000, coreHandler } = {}) {
  const calls = []
  const core = http.createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    calls.push({ service: 'core', url: request.url, headers: request.headers, method: request.method, body })
    if (coreHandler) { coreHandler(request, response); return }
    if (request.headers.origin) { response.writeHead(403).end(); return }
    if (request.url === '/api/v1/auth/login' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': [
        'KAIROS_CSRF=csrf-1; Domain=core.example.test; Path=/api/v1; HttpOnly; Secure; SameSite=Lax',
        'UNRELATED=not-forwarded; Path=/',
      ] }).end(JSON.stringify({ headerName: 'X-CSRF-TOKEN', token: 'csrf-1' }))
    } else if (request.method === 'POST') {
      const valid = request.headers['x-csrf-token'] === 'csrf-1' && request.headers.cookie?.includes('KAIROS_CSRF=csrf-1')
      response.writeHead(valid ? 200 : 403, { 'Content-Type': 'application/json', ...(valid ? { 'Set-Cookie': [
        'KAIROS_ACCESS=access-1; Path=/api/v1; HttpOnly; Secure; SameSite=Lax',
        'KAIROS_REFRESH=refresh-1; Path=/api/v1; HttpOnly; Secure; SameSite=Lax',
      ] } : {}) }).end('{}')
    } else response.writeHead(200, { 'Content-Type': 'application/json' }).end('{"roles":["MANAGER"]}')
  })
  const ai = http.createServer((request, response) => {
    calls.push({ service: 'chat', url: request.url, headers: request.headers })
    response.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'KAIROS_ACCESS=renewed; Path=/api/v1; HttpOnly; Secure; SameSite=Lax' }).end('{"items":[]}')
  })
  const apiUpstream = await start(core)
  const chatbotUpstream = await start(ai)
  const dir = await mkdtemp(join(tmpdir(), 'kairos-proxy-test-'))
  await mkdir(join(dir, 'assets'))
  await writeFile(join(dir, 'index.html'), '<!doctype html><h1>KAIROS</h1>')
  await writeFile(join(dir, 'assets', 'app.css'), 'body{}')
  const app = createApp({ publicOrigin: origin, apiUpstream, chatbotUpstream: chat ? chatbotUpstream : '', distDir: dir, upstreamTimeoutMs: timeout })
  const url = await start(app)
  t.after(async () => {
    for (const server of [app, core, ai]) {
      server.closeAllConnections()
      await new Promise(resolve => server.close(resolve))
    }
    await rm(dir, { recursive: true, force: true })
  })
  return { url, calls }
}

test('proxies login with user cookies and CSRF, preserves rotation and never forwards browser Origin', async t => {
  const { url, calls } = await setup(t)
  const csrf = await fetch(`${url}/api/v1/auth/login`, { headers: { Origin: origin } })
  assert.equal(csrf.status, 200)
  const issued = csrf.headers.getSetCookie()
  assert.equal(issued.length, 1)
  assert.match(issued[0], /HttpOnly; Secure; SameSite=Lax/)
  assert.doesNotMatch(issued[0], /Domain=/)
  const headers = { Origin: origin, 'X-CSRF-TOKEN': 'csrf-1', Cookie: 'KAIROS_CSRF=csrf-1; UNRELATED=private', 'Content-Type': 'application/x-www-form-urlencoded', 'X-Forwarded-Host': 'untrusted.test' }
  const login = await fetch(`${url}/api/v1/auth/login`, { method: 'POST', headers, body: 'email=test%40example.test&password=fixture' })
  assert.equal(login.status, 200)
  assert.equal(login.headers.getSetCookie().length, 2)
  assert.equal(login.headers.get('cache-control'), 'no-store')
  assert.equal(calls[1].headers.cookie, 'KAIROS_CSRF=csrf-1')
  assert.equal(calls[1].headers['x-csrf-token'], 'csrf-1')
  assert.equal(calls[1].headers.origin, undefined)
  assert.equal(calls[1].headers['x-forwarded-host'], undefined)
  assert.equal(calls[1].body, 'email=test%40example.test&password=fixture')
  const rejected = await fetch(`${url}/api/v1/auth/login`, { method: 'POST', headers: { Origin: origin }, body: 'email=test' })
  assert.equal(rejected.status, 403)
})

test('rejects foreign origins and writes without Origin before reaching the backend', async t => {
  const { url, calls } = await setup(t)
  for (const options of [
    { headers: { Origin: 'https://attacker.example.test' } },
    { method: 'POST' },
    { method: 'POST', headers: { Origin: origin, 'Sec-Fetch-Site': 'cross-site' } },
    { method: 'OPTIONS', headers: { Origin: 'https://attacker.example.test', 'Access-Control-Request-Method': 'POST' } },
  ]) assert.equal((await fetch(`${url}/api/v1/auth/login`, options)).status, 403)
  assert.equal(calls.length, 0)
})

test('routes personal chat to Python with user cookies and forwards renewed cookies', async t => {
  const { url, calls } = await setup(t)
  const response = await fetch(`${url}/api/v1/me/chat/conversations?page=0&size=20`, { headers: { Origin: origin, Cookie: 'KAIROS_ACCESS=access-1; KAIROS_REFRESH=refresh-1', 'X-CSRF-TOKEN': 'csrf-1' } })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { items: [] })
  assert.equal(calls[0].service, 'chat')
  assert.equal(calls[0].url, '/api/v1/me/chat/conversations?page=0&size=20')
  assert.equal(calls[0].headers['x-csrf-token'], 'csrf-1')
  assert.match(calls[0].headers.cookie, /KAIROS_REFRESH=refresh-1/)
  assert.equal(calls[0].headers.authorization, undefined)
  assert.match(response.headers.getSetCookie()[0], /KAIROS_ACCESS=renewed/)
})

test('does not substitute the persistence API when Python is not configured', async t => {
  const { url, calls } = await setup(t, { chat: false })
  assert.equal((await fetch(`${url}/api/v1/me/chat/conversations`)).status, 503)
  assert.equal(calls.length, 0)
  assert.equal((await fetch(`${url}/api/v1/auth/me`)).status, 200)
})

test('serves SPA routes and hashed assets without exposing files outside dist or missing scripts', async t => {
  const { url } = await setup(t)
  const dashboard = await fetch(`${url}/dashboard`)
  assert.equal(dashboard.status, 200)
  assert.match(await dashboard.text(), /KAIROS/)
  const asset = await fetch(`${url}/assets/app.css`)
  assert.match(asset.headers.get('content-type'), /text\/css/)
  assert.match(asset.headers.get('cache-control'), /immutable/)
  for (const path of ['/missing.js', '/assets/missing.js', '/.env', '/%2e%2e%2fsecret.txt', '/api']) assert.equal((await fetch(url + path)).status, 404)
  assert.equal((await fetch(`${url}/healthz`)).status, 200)
})

test('never retries writes after an upstream failure', async t => {
  const { url, calls } = await setup(t, { coreHandler: (_, response) => response.writeHead(500).end('failed') })
  const response = await fetch(`${url}/api/v1/products/registration`, { method: 'POST', headers: { Origin: origin }, body: '{}' })
  assert.equal(response.status, 500)
  assert.equal(calls.length, 1)
})

test('rejects upstream redirects without following or exposing their Location', async t => {
  const { url, calls } = await setup(t, { coreHandler: (_, response) => response.writeHead(302, { Location: 'https://untrusted.example.test/' }).end() })
  const response = await fetch(`${url}/api/v1/auth/me`)
  assert.equal(response.status, 502)
  assert.equal(response.headers.get('location'), null)
  assert.equal(calls.length, 1)
})

test('returns a gateway timeout without retrying a request', async t => {
  const { url, calls } = await setup(t, { timeout: 20, coreHandler: () => {} })
  assert.equal((await fetch(`${url}/api/v1/auth/me`)).status, 504)
  assert.equal(calls.length, 1)
})

test('only accepts fixed HTTPS upstreams or loopback HTTP, never credentials or URL paths', () => {
  for (const value of ['http://remote.example.test', 'https://user:password@example.test', 'https://example.test/api', 'https://example.test/?token=secret', 'file:///etc/passwd']) assert.throws(() => upstreamOrigin(value))
  assert.equal(upstreamOrigin('https://api.example.test').origin, 'https://api.example.test')
})
