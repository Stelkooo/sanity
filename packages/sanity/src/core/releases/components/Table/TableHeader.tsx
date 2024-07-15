import {ArrowDownIcon, ArrowUpIcon, SearchIcon} from '@sanity/icons'
import {Button, type ButtonProps, Card, Flex, Stack, TextInput} from '@sanity/ui'

import {useTableContext} from './tableContext'
import {type HeaderProps, type TableHeaderProps} from './types'

export const SortHeaderButton = ({headerProps, ...props}: ButtonProps & HeaderProps) => {
  const {sort, setSearchColumn} = useTableContext()
  const sortIcon = sort?.direction === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <Button
      iconRight={props.header.sorting && sort?.column === props.header.id ? sortIcon : undefined}
      onClick={() => setSearchColumn(String(props.header.id))}
      mode="bleed"
      padding={2}
      radius={3}
      space={1}
      text={props.text}
    />
  )
}

export const TableHeaderSearch = ({
  headerProps,
  searchDisabled,
  placeholder,
}: HeaderProps & {placeholder?: string}) => {
  const {setSearchTerm, searchTerm} = useTableContext()

  return (
    <Stack {...headerProps} flex={1} paddingY={2} paddingRight={3}>
      <TextInput
        border={false}
        fontSize={1}
        icon={SearchIcon}
        placeholder={placeholder || 'Search'}
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

export const TableHeader = ({headers, searchDisabled}: TableHeaderProps) => {
  return (
    <Card as="thead" radius={3}>
      <Flex as="tr">
        {headers.map(({header: Header, id, sorting}) => (
          <Header
            key={String(id)}
            headerProps={{as: 'th', id: String(id)}}
            header={{id, sorting}}
            searchDisabled={searchDisabled}
          />
        ))}
      </Flex>
    </Card>
  )
}
