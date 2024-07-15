import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useCallback, useMemo} from 'react'
import {LoadingBlock} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {type TableContextValue, useTableContext} from './tableContext'
import {TableHeader} from './TableHeader'
import {TableProvider} from './TableProvider'
import {type Column} from './types'

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
  rowActions?: ({
    datum,
  }: {
    datum: AdditionalD extends undefined ? D : D & AdditionalD
  }) => JSX.Element
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
  rowActions,
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

  const rowActionColumnDef: Column = useMemo(
    () => ({
      id: 'actions',
      sorting: false,
      width: 50,
      header: ({headerProps: {id}}) => (
        <Flex as="th" id={id} paddingY={3} sizing="border" style={{width: 50}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              &nbsp;
            </Text>
          </Box>
        </Flex>
      ),
      cell: ({datum, cellProps: {id}}) => (
        <Flex as="td" id={id} align="center" flex="none" padding={3}>
          {rowActions?.({datum})}
        </Flex>
      ),
    }),
    [rowActions],
  )

  const _columnDefs = useMemo(
    () => (rowActions ? [...columnDefs, rowActionColumnDef] : columnDefs),
    [columnDefs, rowActionColumnDef, rowActions],
  )

  const renderRow = useCallback(
    (rowIndex: number) =>
      function TableRow(datum: D | (D & AdditionalD)) {
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
            {_columnDefs.map(({cell: Cell, width, id, sorting = false}) => (
              <Fragment key={String(id)}>
                <Cell
                  datum={datum as D & AdditionalD}
                  cellProps={{
                    as: 'td',
                    id: String(id),
                    style: {width: width || undefined},
                  }}
                  router={router}
                  sorting={sorting}
                />
              </Fragment>
            ))}
          </Card>
        )
      },
    [_columnDefs, router, rowId],
  )

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

    return filteredData.map((datum, rowIndex) => {
      if (!Row) return renderRow(rowIndex)(datum)
      return (
        <Row key={rowId ? String(datum[rowId]) : rowIndex} datum={datum} searchTerm={searchTerm}>
          {renderRow(rowIndex)}
        </Row>
      )
    })
  }, [Row, emptyState, filteredData, renderRow, rowId, searchTerm])

  const headers = useMemo(() => _columnDefs.map(({cell, ...header}) => header), [_columnDefs])

  if (loading) {
    return <LoadingBlock fill data-testid="table-loading" />
  }

  return (
    <Stack as="table" space={1}>
      <TableHeader headers={headers} searchDisabled={!searchTerm && !data.length} />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}

export const Table = <D, AdditionalD = undefined>(props: TableProps<D, AdditionalD>) => {
  return (
    <TableProvider>
      <TableInner<D, AdditionalD> {...props} />
    </TableProvider>
  )
}
