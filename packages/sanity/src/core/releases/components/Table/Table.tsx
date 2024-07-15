import {Card, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useCallback, useMemo} from 'react'
import {LoadingBlock} from 'sanity'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {useTableContext} from './tableContext'
import {TableHeader} from './TableHeader'
import {TableProvider} from './TableProvider'
import {type TableProps} from './types'

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
      },
    [columnDefs, router, rowId],
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

export const Table = <D, AdditionalD = undefined>(props: TableProps<D, AdditionalD>) => {
  return (
    <TableProvider>
      <TableInner<D, AdditionalD> {...props} />
    </TableProvider>
  )
}
