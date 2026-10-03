'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ShopeeAccount {
  id: string
  accountName: string
}

interface FilterContextType {
  selectedAccountId: string | null
  setSelectedAccountId: (id: string | null) => void
  accounts: ShopeeAccount[]
  loading: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<ShopeeAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const res = await fetch('/api/integrations/shopee')
      const data = await res.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FilterContext.Provider
      value={{
        selectedAccountId,
        setSelectedAccountId,
        accounts,
        loading,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}
