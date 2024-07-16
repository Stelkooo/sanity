import {AvatarStack, Box, Flex, Text} from '@sanity/ui'
import {RelativeTime, UserAvatar} from 'sanity'

import {ReleaseDocumentPreview} from '../../components/ReleaseDocumentPreview'
import {SortHeaderButton, TableHeaderSearch} from '../../components/Table/TableHeader'
import {type Column} from '../../components/Table/types'
import {type BundleDocumentRow} from './ReleaseSummary'

export const releaseSummaryColumnDefs: Column<BundleDocumentRow>[] = [
  {
    id: 'search',
    width: null,
    header: (props) => <TableHeaderSearch {...props} placeholder="Search documents" />,
    cell: ({cellProps, datum: document}) => (
      <Box {...cellProps} flex={1} padding={1}>
        <ReleaseDocumentPreview
          documentId={document._id}
          documentTypeName={document._type}
          releaseName="releaseName"
          previewValues={document.previewValues}
          isLoading={!!document.isLoading}
        />
      </Box>
    ),
  },
  {
    id: '_createdAt',
    sorting: true,
    width: 130,
    header: (headerProps) => (
      <Flex {...headerProps.headerProps} paddingY={3} sizing="border">
        <SortHeaderButton text="Created" {...headerProps} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document._createdAt && (
          <Flex align="center" gap={2}>
            {document.history?.createdBy && (
              <UserAvatar size={0} user={document.history.createdBy} />
            )}
            <Text muted size={1}>
              <RelativeTime time={document._createdAt} useTemporalPhrase minimal />
            </Text>
          </Flex>
        )}
      </Flex>
    ),
  },
  {
    id: '_updatedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <SortHeaderButton text="Edited" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document._updatedAt && (
          <Flex align="center" gap={2}>
            {document.history?.lastEditedBy && (
              <UserAvatar size={0} user={document.history.lastEditedBy} />
            )}
            <Text muted size={1}>
              <RelativeTime time={document._updatedAt} useTemporalPhrase minimal />
            </Text>
          </Flex>
        )}
      </Flex>
    ),
  },
  {
    id: '_publishedAt',
    sorting: true,
    width: 130,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <SortHeaderButton text="Published" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {/* TODO: How to get the publishedAt date from the document, consider history API */}
        {/* {document._publishedAt && (
      <Flex align="center" gap={2}>
        <UserAvatar size={0} user={document._publishedBy} />
        <Text muted size={1}>
          <RelativeTime time={document._publishedAt} />
        </Text>
      </Flex>
    )} */}

        {!document._publishedAt && (
          <Text muted size={1}>
            &nbsp;
          </Text>
        )}
      </Flex>
    ),
  },
  {
    id: 'contributors',
    sorting: false,
    width: 100,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            Contributors
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: document, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        {document.history?.editors && (
          <AvatarStack maxLength={3} size={0}>
            {document.history.editors.map((userId) => (
              <UserAvatar key={userId} user={userId} />
            ))}
          </AvatarStack>
        )}
      </Flex>
    ),
  },
]
