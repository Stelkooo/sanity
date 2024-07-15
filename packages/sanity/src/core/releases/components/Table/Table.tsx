import {Card, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useMemo, useState} from 'react'
import {LoadingBlock} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {TableHeader, type TableHeaderProps} from './TableHeader'

export interface InjectedTableProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  id: string
}

export interface Column<D> {
  header: (
    props: {headerProps: InjectedTableProps} & Omit<TableHeaderProps<D>, 'headers'>,
  ) => JSX.Element
  cell: (
    props: D & {cellProps: InjectedTableProps} & {sorting: boolean; router: RouterContextValue},
  ) => React.ReactNode
  id: keyof D
  sorting?: boolean
}

interface TableProps<D> {
  columnDefs: Column<D>[]
  searchFilterPredicate?: (data: D[], searchTerm: string) => D[]
  Row?: () => any
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

export const Table = <D,>({
  columnDefs,
  data,
  loading,
  emptyState,
  searchFilterPredicate,
  Row,
  rowId,
}: TableProps<D>) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [sort, setSort] = useState<{column: Column<D>['id']; direction: 'asc' | 'desc'} | null>(
    null,
  )
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

    const renderRow = (rowIndex) => (datum) => (
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
              {...datum}
              cellProps={{as: 'td', id: String(id)}}
              router={router}
              sorting={sorting}
            />
          </Fragment>
        ))}
      </Card>
    )

    return filteredData.map((datum, rowIndex) => {
      if (!Row) return renderRow(rowIndex)(datum)
      return (
        <Row key={rowId ? String(datum[rowId]) : rowIndex} datum={datum} searchTerm={searchTerm}>
          {renderRow(rowIndex)}
        </Row>
      )
    })
  }, [columnDefs, emptyState, filteredData, router, rowId, searchTerm])

  if (loading) {
    return <LoadingBlock fill data-testid="table-loading" />
  }

  return (
    <Stack as="table" space={1}>
      <TableHeader<D>
        headers={columnDefs.map((column) => ({
          header: column.header,
          id: column.id,
          sorting: column.sorting,
        }))}
        sort={sort}
        setSort={setSort}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        searchDisabled={!searchTerm && !data.length}
      />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}
