import { requireUserMiddleware } from '#app/middleware.server.ts'

export const unstable_middleware = [requireUserMiddleware]