import {ArrowDownIcon, ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Card, Flex, Stack, TextInput} from '@sanity/ui'

import {Button, type ButtonProps} from '../../../../ui-components'
import {type Column, type InjectedTableProps} from './Table'
import {useTableContext} from './tableContext'

export interface TableHeaderProps<D> {
  headers: Omit<Column<D>, 'cell'>[]
  searchDisabled?: boolean
}

export type HeaderProps<D> = Omit<TableHeaderProps<D>, 'headers'> & {
  // eslint-disable-next-line react/no-unused-prop-types
  headerProps: InjectedTableProps
  header: Pick<Column<D>, 'sorting' | 'id'>
}

export const SortHeaderButton = <D,>(props: ButtonProps & HeaderProps<D>) => {
  const {sort, setSearchColumn} = useTableContext()
  const sortIcon = sort?.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <Button
      iconRight={props.header.sorting && sort?.column === props.header.id ? sortIcon : undefined}
      onClick={() => setSearchColumn(String(props.header.id))}
      mode="bleed"
      style={{
        padding: 2,
        borderRadius: 3,
        gap: 1,
      }}
      text={props.text}
    />
  )
}

export const TableHeaderSearch = <D,>({headerProps, searchDisabled}: HeaderProps<D>) => {
  const {setSearchTerm, searchTerm} = useTableContext()

  return (
    <Stack {...headerProps} flex={1} paddingY={2} paddingRight={3}>
      <TextInput
        border={false}
        fontSize={1}
        icon={SearchIcon}
        placeholder="Search releases"
        radius={3}
        value={searchTerm || ''}
        disabled={searchDisabled}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        onClear={() => setSearchTerm('')}
        clearButton={!!searchTerm}
      />
    </Stack>
  )
}

export const TableHeader = <D,>({headers, ...restProps}: TableHeaderProps<D>) => {
  return (
    <Card as="thead" radius={3}>
      <Flex as="tr">
        {headers.map(({header: Header, id, sorting}) => (
          <Header
            key={String(id)}
            headerProps={{as: 'th', id: String(id)}}
            header={{id, sorting}}
            {...restProps}
          />
        ))}
      </Flex>
    </Card>
  )
}
