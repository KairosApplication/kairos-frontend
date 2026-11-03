import http from 'node:http'
import https from 'node:https'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const cookies = new Set(['KAIROS_ACCESS', 'KAIROS_REFRESH', 'KAIROS_CSRF', 'JSESSIONID'])
const readMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
const methods = new Set([...readMethods, 'POST', 'PUT', 'PATCH', 'DELETE'])
const requestHeaders = ['accept', 'accept-language', 'authorization', 'content-type', 'content-length', 'x-csrf-token']
const responseHeaders = ['content-type', 'content-encoding', 'content-length', 'content-disposition', 'www-authenticate', 'allow']
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2' }

export function upstreamOrigin(value) {
  if (!value?.trim()) return null
  const url = new URL(value)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/'
    || (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))) {
    throw new Error('Upstream must be an HTTPS origin, or HTTP loopback for local tests.')
  }
  return url
}

function json(response, status, message) {
  if (response.writableEnded) return
  if (response.headersSent) { response.destroy(); return }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify({ message }))
}

function proxy(request, response, target, timeoutMs) {
  if (!target) { json(response, 503, 'O serviço solicitado ainda não foi configurado.'); return }
  if (Number(request.headers['content-length']) > 2 * 1024 * 1024) {
    json(response, 413, 'A solicitação excede o tamanho permitido.'); return
  }
  // Forward only user authentication. Never inject a service token.
  const headers = {}
  for (const name of requestHeaders) if (request.headers[name]) headers[name] = request.headers[name]
  const userCookies = request.headers.cookie?.split(';').filter(item => cookies.has(item.trim().split('=', 1)[0])).join(';')
  if (userCookies) headers.cookie = userCookies
  // Origin is validated against the frontend before making this server-to-server call.
  // Incoming Host, Origin, Referer and X-Forwarded-* are not trusted or forwarded.
  const transport = target.protocol === 'https:' ? https : http
  const upstream = transport.request({ protocol: target.protocol, hostname: target.hostname.replace(/^\[|\]$/g, ''), port: target.port || undefined,
    method: request.method, path: request.url, headers }, reply => {
    if (response.writableEnded) { reply.resume(); return }
    if (reply.statusCode >= 300 && reply.statusCode < 400) {
      reply.resume(); json(response, 502, 'O serviço retornou um redirecionamento inesperado.'); return
    }
    const resultHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' }
    for (const name of responseHeaders) if (reply.headers[name]) resultHeaders[name] = reply.headers[name]
    const setCookies = (reply.headers['set-cookie'] ?? [])
      .filter(value => cookies.has(value.split('=', 1)[0]))
      .map(value => value.split(';').filter(part => !/^\s*domain\s*=/i.test(part)).join(';'))
    if (setCookies.length) resultHeaders['set-cookie'] = setCookies
    response.writeHead(reply.statusCode, resultHeaders)
    reply.on('error', () => response.destroy())
    reply.pipe(response)
  })
  upstream.setTimeout(timeoutMs, () => {
    json(response, 504, 'O serviço demorou para responder. Consulte o histórico antes de repetir uma operação.')
    upstream.destroy()
  })
  upstream.on('error', () => json(response, 502, 'Não foi possível acessar o serviço solicitado.'))
  let bytes = 0
  request.on('data', chunk => {
    bytes += chunk.length
    if (bytes > 2 * 1024 * 1024) { json(response, 413, 'A solicitação excede o tamanho permitido.'); upstream.destroy() }
  })
  request.on('aborted', () => upstream.destroy())
  response.on('close', () => { if (!response.writableEnded) upstream.destroy() })
  request.pipe(upstream)
}

export function createApp({ publicOrigin, apiUpstream, chatbotUpstream, distDir, upstreamTimeoutMs = 130000 }) {
  const frontend = upstreamOrigin(publicOrigin)
  if (!frontend) throw new Error('PUBLIC_ORIGIN or RENDER_EXTERNAL_URL is required.')
  const api = upstreamOrigin(apiUpstream)
  if (!api) throw new Error('API_UPSTREAM_URL is required.')
  const chatbot = upstreamOrigin(chatbotUpstream)
  const root = resolve(distDir)
  const server = http.createServer(async (request, response) => {
    try {
      if (!request.url?.startsWith('/') || request.url.startsWith('//')) { json(response, 400, 'Endereço inválido.'); return }
      const url = new URL(request.url, frontend)
      if (url.pathname === '/healthz' && request.method === 'GET') { json(response, 200, 'UP'); return }
      if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
        if (!methods.has(request.method)) { json(response, 405, 'Método não permitido.'); return }
        const origin = request.headers.origin
        if (request.headers['sec-fetch-site'] === 'cross-site' || (origin && origin !== frontend.origin)
          || (!readMethods.has(request.method) && origin !== frontend.origin)) {
          json(response, 403, 'Origem não autorizada.'); return
        }
        if (!url.pathname.startsWith('/api/v1/')) { json(response, 404, 'Rota não encontrada.'); return }
        const isChat = /^\/api\/v1\/me\/chat(?:\/|$)/.test(url.pathname)
        proxy(request, response, isChat ? chatbot : api, upstreamTimeoutMs)
        return
      }
      if (!['GET', 'HEAD'].includes(request.method)) { json(response, 405, 'Método não permitido.'); return }
      let pathname
      try { pathname = decodeURIComponent(url.pathname) } catch { json(response, 400, 'Endereço inválido.'); return }
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) {
        json(response, 404, 'Arquivo não encontrado.'); return
      }
      let file = resolve(root, `.${pathname}`)
      if (file !== root && !file.startsWith(root + sep)) { json(response, 404, 'Arquivo não encontrado.'); return }
      let info = await stat(file).catch(() => null)
      if (!info?.isFile()) {
        if (extname(pathname) || pathname.startsWith('/assets/')) { json(response, 404, 'Arquivo não encontrado.'); return }
        file = resolve(root, 'index.html')
        info = await stat(file)
      }
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size,
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' })
      if (request.method === 'HEAD') response.end()
      else createReadStream(file).on('error', () => response.destroy()).pipe(response)
    } catch { json(response, 500, 'Não foi possível atender a solicitação.') }
  })
  server.headersTimeout = 15000
  server.requestTimeout = 150000
  return server
}
