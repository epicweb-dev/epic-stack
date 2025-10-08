import { requireUserMiddleware } from '#app/middleware.server.ts'

export const middleware = [requireUserMiddleware]
