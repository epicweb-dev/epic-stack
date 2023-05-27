import * as React from 'react'

export const NonceContext = React.createContext<string>('')
export const NonceProvider = NonceContext.Provider
export const useNonce = () => React.useContext(NonceContext)
