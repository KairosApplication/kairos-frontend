import { fileURLToPath } from 'node:url'
import { createApp } from './proxy.mjs'

const port = Number(process.env.PORT || 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.')
const publicOrigin = process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL
  || (process.env.NODE_ENV !== 'production' ? `http://localhost:${port}` : '')
const app = createApp({ publicOrigin, apiUpstream: process.env.API_UPSTREAM_URL, chatbotUpstream: process.env.CHATBOT_UPSTREAM_URL,
  distDir: fileURLToPath(new URL('../dist/', import.meta.url)) })
app.listen(port, '0.0.0.0', () => console.log(`KAIROS frontend listening on port ${port}`))
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  app.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10000).unref()
})
