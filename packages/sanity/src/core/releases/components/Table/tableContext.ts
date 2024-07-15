import {createContext, useContext} from 'react'

export interface TableContextValue {
  searchTerm: string | null
  setSearchTerm: (searchTerm: string) => void
  sort: {column: string; direction: 'asc' | 'desc'} | null
  setSearchColumn: (column: string) => void
}

const DEFAULT_TABLE_CONTEXT = {
  searchTerm: null,
  setSearchTerm: () => {},
  sort: null,
  setSearchColumn: () => {},
}

export const TableContext = createContext<TableContextValue | null>(null)

export const useTableContext = () => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider')
  }
  return context || DEFAULT_TABLE_CONTEXT
}
