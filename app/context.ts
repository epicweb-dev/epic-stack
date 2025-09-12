import { createContext } from 'react-router'

// Holds the authenticated user's ID for routes protected by middleware
export const userIdContext = createContext<string | null>(null)
