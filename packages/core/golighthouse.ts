import path from 'path'
import { createLogger } from './logging'

const uiEntryPath = '@golighthouse/ui/dist/index.html'

export class Golighthouse {
  start() {
    const uiBaseDir = path.resolve(require.resolve(uiEntryPath), '..')
    const log = createLogger()
    // host ui
    const server = Bun.serve({
        port: 5000,
        async fetch(req) {
          const { pathname } = new URL(req.url)
          const file = Bun.file(path.resolve(uiBaseDir, pathname === '/' ? 'index.html' : `.${pathname}`))
          return (await file.exists())
            ? new Response(file)
            : new Response(Bun.file(path.resolve(uiBaseDir, 'index.html')))
        }
      },
    )

    log.log(`Listening on ${server.url}`)
  }
}