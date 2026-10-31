// Short-lived business data stays in this tab and is isolated by authenticated identity.
const paths = new Set(['/store-map', '/employees/list', '/customers/list', '/restockings/list', '/inventories/list', '/categories/list'])
const ttl = 30000
let scope: string | null = null
let revision = 0
const values = new Map<string, { value: unknown; expires: number }>()
const pending = new Map<string, { controller: AbortController; promise: Promise<unknown> }>()

export function clearApiReads() {
  revision++
  values.clear()
  for (const entry of pending.values()) entry.controller.abort()
  pending.clear()
}

export function setApiReadScope(next: string | null) {
  if (next !== scope) { clearApiReads(); scope = next }
}

export function sharedApiRead(path: string, load: (signal?: AbortSignal) => Promise<unknown>, signal?: AbortSignal): Promise<unknown> {
  signal?.throwIfAborted()
  if (!scope || !paths.has(path)) return load(signal)
  const saved = values.get(path)
  if (saved && saved.expires > Date.now()) return Promise.resolve(structuredClone(saved.value))
  values.delete(path)
  let entry = pending.get(path)
  if (!entry) {
    const generation = revision
    const controller = new AbortController()
    const promise = Promise.resolve().then(() => { controller.signal.throwIfAborted(); return load(controller.signal) })
      .then(value => {
        controller.signal.throwIfAborted()
        if (generation !== revision) throw new DOMException('Consulta invalidada.', 'AbortError')
        values.set(path, { value, expires: Date.now() + ttl })
        return value
      }).finally(() => { if (pending.get(path)?.promise === promise) pending.delete(path) })
    entry = { controller, promise }
    pending.set(path, entry)
  }
  // Navigation cancels this reader, but other pages can reuse the same bounded request.
  return new Promise((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener('abort', abort)
    const abort = () => { cleanup(); reject(signal?.reason) }
    signal?.addEventListener('abort', abort, { once: true })
    entry.promise.then(value => {
      cleanup()
      if (!signal?.aborted) { try { resolve(structuredClone(value)) } catch (cause) { reject(cause) } }
    }, cause => { cleanup(); reject(cause) })
  })
}
