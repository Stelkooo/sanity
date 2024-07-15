import {type RouterContextValue} from 'sanity/router'

import {type TableContextValue} from './tableContext'

export interface InjectedTableProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  id: string
  style: {width?: number}
}

export interface Column<D = any> {
  header: (props: HeaderProps) => JSX.Element
  cell: (props: {
    datum: D
    cellProps: InjectedTableProps
    sorting: boolean
    router: RouterContextValue
  }) => React.ReactNode
  id: keyof D | string
  width: number | null
  sorting?: boolean
}

export interface TableProps<D, AdditionalD> {
  columnDefs: AdditionalD extends undefined ? Column<D>[] : Column<D & AdditionalD>[]
  searchFilterPredicate?: (data: D[], searchTerm: string) => D[]
  Row?: ({
    datum,
    children,
    searchTerm,
  }: {
    datum: D
    children: (rowData: D) => JSX.Element
    searchTerm: TableContextValue['searchTerm']
  }) => JSX.Element | null
  data: D[]
  emptyState: (() => JSX.Element) | string
  loading: boolean
  rowId?: keyof D
}

export interface TableHeaderProps {
  headers: Omit<Column, 'cell'>[]
  searchDisabled?: boolean
}

export type HeaderProps = Omit<TableHeaderProps, 'headers'> & {
  headerProps: InjectedTableProps
  header: Pick<Column, 'sorting' | 'id'>
}
