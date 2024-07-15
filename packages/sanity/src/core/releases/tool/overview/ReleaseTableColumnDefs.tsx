import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {BundleBadge, RelativeTime, UserAvatar} from 'sanity'

import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {type TableBundle} from '../../components/ReleasesTable/ReleasesTable'
import {type Column} from '../../components/Table/Table'
import {SortHeaderButton, TableHeaderSearch} from '../../components/Table/TableHeader'

const ReleaseNameCell: Column<TableBundle>['cell'] = ({cellProps, router, datum: bundle}) => {
  return (
    <Box {...cellProps} flex={1} padding={1}>
      <Card
        as="a"
        // navigate to bundle detail
        onClick={() => router.navigate({bundleName: bundle.name})}
        padding={2}
        radius={2}
      >
        <Flex align="center" gap={2}>
          <Box flex="none">
            <BundleBadge tone={bundle.tone} icon={bundle.icon} />
          </Box>
          <Stack flex={1} space={2}>
            <Flex align="center" gap={2}>
              <Text size={1} weight="medium">
                {bundle.title}
              </Text>
            </Flex>
          </Stack>
        </Flex>
      </Card>
    </Box>
  )
}

export const columnDefs: Column<TableBundle>[] = [
  {
    id: 'search',
    sorting: false,
    header: TableHeaderSearch,
    cell: ReleaseNameCell,
  },
  {
    id: 'documentCount',
    sorting: false,
    header: ({headerProps}) => (
      <Flex {...headerProps} paddingY={3} sizing="border" style={{width: 90}}>
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            Documents
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: {documentsMetadata}, cellProps}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 90}}
      >
        <Text muted size={1}>
          {documentsMetadata.documentCount}
        </Text>
      </Flex>
    ),
  },
  {
    id: '_createdAt',
    sorting: true,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border" style={{width: 120}}>
        <SortHeaderButton text="Created" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: bundle}) => (
      <Flex
        {...cellProps}
        align="center"
        gap={2}
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 120}}
      >
        {bundle.authorId && <UserAvatar size={0} user={bundle.authorId} />}
        <Text muted size={1}>
          <RelativeTime time={bundle._createdAt} useTemporalPhrase minimal />
        </Text>
      </Flex>
    ),
  },
  {
    id: 'documentsMetadata.updatedAt',
    sorting: true,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border" style={{width: 100}}>
        <SortHeaderButton text="Edited" {...props} />
      </Flex>
    ),
    cell: ({datum: {documentsMetadata}, cellProps}) => (
      <Flex
        {...cellProps}
        align="center"
        gap={2}
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 100}}
      >
        {documentsMetadata.updatedAt && (
          <Text muted size={1}>
            <RelativeTime time={documentsMetadata.updatedAt} useTemporalPhrase minimal />
          </Text>
        )}
      </Flex>
    ),
  },
  {
    id: 'publishedAt',
    sorting: true,
    header: (props) => (
      <Flex
        {...props.headerProps}
        align="center"
        gap={1}
        paddingX={1}
        paddingY={0}
        sizing="border"
        style={{width: 100}}
      >
        <SortHeaderButton text="Published" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: bundle}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 100}}
      >
        {!!bundle.publishedAt && (
          <Text muted size={1}>
            <RelativeTime time={bundle.publishedAt} />
          </Text>
        )}
      </Flex>
    ),
  },
  {
    id: 'actions',
    sorting: false,
    header: ({headerProps}) => (
      <Flex
        {...headerProps}
        align="center"
        gap={1}
        paddingX={2}
        paddingY={1}
        sizing="border"
        style={{width: 50}}
      />
    ),
    cell: ({cellProps, datum: bundle}) => (
      <Flex {...cellProps} align="center" flex="none" padding={3}>
        <BundleMenuButton bundle={bundle} documentCount={bundle.documentsMetadata.documentCount} />
      </Flex>
    ),
  },
]
