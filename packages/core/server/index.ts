import path from 'path'
import { EventEmitter } from 'node:events'
import type { GolighthouseContext } from '../types'

const sseEvents = new EventEmitter()
const JOB_EVENT = 'job-event'

export const createServer = (context: GolighthouseContext) => {
  const { runtimeSetting: { clientDir, artifactsDir } } = context
  const clientIndexFile = Bun.file(path.resolve(clientDir, 'index.html'))

  context.hooks.hook('job-added', () => { })
  context.hooks.hook('job-started', () => {})
  context.hooks.hook('job-completed', () => {})
  context.hooks.hook('job-failed', () => {})

  return Bun.serve({
    port: 5000,
    // `routes` requires Bun v1.2.3+
    routes: {
      "/api/status": new Response("OK"),

      "/api/jobs/:id/rescan": {
        POST: async req => {
          return Response.json({})
        }
      },

      // Per-HTTP method handlers
      "/api/jobs": {
        GET: () => new Response("List jobs"),
      },

      "/api/job-events": async req => {
        const stream = new ReadableStream({
          pull(controller: ReadableStreamDefaultController) {
            sseEvents.on("job-event", (data) => {
              const queue = [Buffer.from(data)];
              const chunk = queue.shift();
              controller.enqueue(chunk);
            });
          },
          cancel(controller: ReadableStreamDefaultController) {
            sseEvents.removeAllListeners("sse");
            controller.close();
          },
        })

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream;charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          }
        })
      },

      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": Response.json({ message: "Not found" }, { status: 404 }),
      "/artifacts/*": async req => {
        const { pathname } = new URL(req.url)
        const pnWithoutPrefix = pathname.replace(/^\/artifacts\//, '')
        const file = Bun.file(path.resolve(artifactsDir, `${pnWithoutPrefix}`))

        if (await file.exists()) {
          return new Response(file)
        }

        return new Response("Not Found", { status: 404 })
      },
    },

    // (optional) fallback for unmatched routes:
    // Required if Bun's version < 1.2.3
    async fetch(req) {
      const { pathname } = new URL(req.url)
      const fp = pathname === '/' ? 'index.html' : `.${pathname}`
      const file = Bun.file(path.resolve(clientDir, fp))

      if (await file.exists()) {
        return new Response(file)
      }

      return new Response(clientIndexFile)
    },
  })
}