import {ArrowDownIcon, ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Card, Flex, Stack, TextInput} from '@sanity/ui'

import {Button, type ButtonProps} from '../../../../ui-components'
import {type Column, type InjectedTableProps} from './Table'

export interface TableHeaderProps<D> {
  headers: Omit<Column<D>, 'cell'>[]
  searchDisabled?: boolean
  searchTerm?: string | null
  setSearchTerm: (value: string | null) => void
  sort: {column: keyof D; direction: 'asc' | 'desc'} | null
}

type HeaderProps<D> = Omit<TableHeaderProps<D>, 'headers'> & {headerProps: InjectedTableProps} & {
  header: Pick<Column<D>, 'sorting' | 'id'>
}

export const SortHeaderButton = <D,>(props: ButtonProps & HeaderProps<D>) => {
  const sortIcon = props.sort?.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <Button
      iconRight={
        props.header.sorting && props.sort?.column === props.header.id ? sortIcon : undefined
      }
      onClick={() =>
        props.setSort((s) => {
          if (s?.column === props.header.id) {
            return {...s, direction: s.direction === 'asc' ? 'desc' : 'asc'}
          }

          return {column: props.header.id, direction: 'desc'}
        })
      }
      mode="bleed"
      padding={2}
      radius={3}
      space={1}
      text={props.text}
    />
  )
}

export const TableHeaderSearch = <D,>({
  headerProps,
  setSearchTerm,
  searchTerm,
  searchDisabled,
}: HeaderProps<D>) => (
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

export const TableHeader = <D,>({headers, ...restProps}: TableHeaderProps<D>) => {
  return (
    <Card as="thead" radius={3}>
      <Flex as="tr">
        {headers.map(({header: Header, id, sorting}) => (
          <Header
            key={String(id)}
            headerProps={{as: 'th', id: String(id)}}
            header={{sorting, id}}
            {...restProps}
          />
        ))}
      </Flex>
    </Card>
  )
}
