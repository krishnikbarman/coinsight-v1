import React, { createContext, useState, useContext } from 'react'

const AppStatusContext = createContext()

export const useAppStatus = () => {
  const context = useContext(AppStatusContext)
  if (!context) {
    throw new Error('useAppStatus must be used within AppStatusProvider')
  }
  return context
}

export const AppStatusProvider = ({ children }) => {
  const [isLiveData, setIsLiveData] = useState(true)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [apiStatusSource, setApiStatusSource] = useState('initial')

  const value = {
    isLiveData,
    setIsLiveData,
    isLoadingPrices,
    setIsLoadingPrices,
    lastUpdate,
    setLastUpdate,
    apiStatusSource,
    setApiStatusSource
  }

  return (
    <AppStatusContext.Provider value={value}>
      {children}
    </AppStatusContext.Provider>
  )
}
