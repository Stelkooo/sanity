import {useState} from 'react'

import {type Column} from './Table'
import {TableContext} from './tableContext'

export const TableProvider = <D,>({children}) => {
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [sort, setSort] = useState<{column: Column<D>['id']; direction: 'asc' | 'desc'} | null>(
    null,
  )

  const setSearchColumn = (newColumn: keyof D) => {
    setSort((s) => {
      if (s?.column === newColumn) {
        return {...s, direction: s.direction === 'asc' ? 'desc' : 'asc'}
      }

      return {column: newColumn, direction: 'desc'}
    })
  }

  const contextValue = {searchTerm, setSearchTerm, sort, setSearchColumn}

  return <TableContext.Provider value={contextValue}>{children}</TableContext.Provider>
}
