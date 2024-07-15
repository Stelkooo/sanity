/* eslint-disable react/display-name */
import {Card, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useMemo} from 'react'
import {LoadingBlock} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {type TableContextValue, useTableContext} from './tableContext'
import {type HeaderProps, TableHeader} from './TableHeader'
import {TableProvider} from './TableProvider'

export interface InjectedTableProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  id: string
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

const RowStack = styled(Stack)({
  '& > *:not(:first-child)': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -1,
  },

  '& > *:not(:last-child)': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
})

const TableInner = <D, AdditionalD>({
  columnDefs,
  data,
  loading,
  emptyState,
  searchFilterPredicate,
  Row,
  rowId,
}: TableProps<D, AdditionalD>) => {
  const router = useRouter()
  const {searchTerm, sort} = useTableContext()

  const filteredData = useMemo(() => {
    const filteredResult =
      searchTerm && searchFilterPredicate ? searchFilterPredicate(data, searchTerm) : data
    if (!sort) return filteredResult

    return [...filteredResult].sort((a, b) => {
      const aDateString = get(a, sort.column)
      const bDateString = get(b, sort.column)

      const aDate = typeof aDateString === 'string' ? Date.parse(aDateString) : 0
      const bDate = typeof bDateString === 'string' ? Date.parse(bDateString) : 0
      const order = aDate - bDate
      if (sort.direction === 'asc') {
        return order
      }

      return -order
    })
  }, [data, searchFilterPredicate, searchTerm, sort])

  const tableContent = useMemo(() => {
    if (filteredData.length === 0) {
      if (typeof emptyState === 'string') {
        return (
          <Card
            as="tr"
            border
            radius={3}
            display="flex"
            padding={4}
            style={{
              justifyContent: 'center',
            }}
          >
            <Text as="td" muted size={1}>
              {emptyState}
            </Text>
          </Card>
        )
      }
      return emptyState()
    }

    const renderRow = (rowIndex: number) => (datum: D | (D & AdditionalD)) => {
      return (
        <Card
          key={rowId ? String(datum[rowId]) : rowIndex}
          data-testid="table-row"
          as="tr"
          border
          radius={3}
          display="flex"
          margin={-1}
        >
          {columnDefs.map(({cell: Cell, id, sorting = false}) => (
            <Fragment key={String(id)}>
              <Cell
                datum={datum as D & AdditionalD}
                cellProps={{as: 'td', id: String(id)}}
                router={router}
                sorting={sorting}
              />
            </Fragment>
          ))}
        </Card>
      )
    }

    return filteredData.map((datum, rowIndex) => {
      if (!Row) return renderRow(rowIndex)(datum)
      return (
        <Row key={rowId ? String(datum[rowId]) : rowIndex} datum={datum} searchTerm={searchTerm}>
          {renderRow(rowIndex)}
        </Row>
      )
    })
  }, [Row, columnDefs, emptyState, filteredData, router, rowId, searchTerm])

  if (loading) {
    return <LoadingBlock fill data-testid="table-loading" />
  }

  return (
    <Stack as="table" space={1}>
      <TableHeader
        headers={columnDefs.map((column) => ({
          header: column.header,
          id: column.id,
          sorting: column.sorting,
        }))}
        searchDisabled={!searchTerm && !data.length}
      />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}

export const Table = <D, AD = undefined>(props: TableProps<D, AD>) => {
  return (
    <TableProvider>
      <TableInner<D, AD> {...props} />
    </TableProvider>
  )
}
