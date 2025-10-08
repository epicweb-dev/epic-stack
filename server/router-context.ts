import { createContext, type ServerBuild } from 'react-router'

// Shared context key for passing the built routes into loaders (e.g. sitemap)
export const serverBuildContext = createContext<
  Promise<{ error: unknown; build: ServerBuild }> | null
>(null)

