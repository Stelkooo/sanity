import {AvatarStack, Box, Card, Flex, Text} from '@sanity/ui'
import {type ForwardRefExoticComponent, type RefAttributes} from 'react'
import {RelativeTime, SanityDefaultPreview, type SanityDocument, UserAvatar} from 'sanity'

import {type Column} from '../../components/Table/Table'
import {SortHeaderButton, TableHeaderSearch} from '../../components/Table/TableHeader'
import {DocumentActions} from './documentTable/DocumentActions'
import {type useDocumentPreviewValues} from './documentTable/useDocumentPreviewValues'
import {type DocumentWithHistory} from './ReleaseSummary'

export const getReleaseSummaryColumnDefs = (
  getLinkComponent: (
    documentId: SanityDocument['_id'],
    documentTypeName: SanityDocument['_type'],
  ) => ForwardRefExoticComponent<RefAttributes<HTMLAnchorElement>>,
): Column<DocumentWithHistory & ReturnType<typeof useDocumentPreviewValues>>[] => [
  {
    id: 'search',
    header: TableHeaderSearch,
    cell: ({cellProps, datum: document}) => (
      <Box {...cellProps} flex={1} padding={1}>
        <Card as={getLinkComponent(document._id, document._type)} radius={2} data-as="a">
          <SanityDefaultPreview {...document.previewValues} isPlaceholder={document.isLoading} />
        </Card>
      </Box>
    ),
  },
  {
    id: '_createdAt',
    sorting: true,
    header: (headerProps) => (
      <Flex {...headerProps.headerProps} paddingY={3} sizing="border" style={{width: 130}}>
        <SortHeaderButton text="Created" {...headerProps} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 130}}
      >
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
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border" style={{width: 130}}>
        <SortHeaderButton text="Edited" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 130}}
      >
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
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border" style={{width: 130}}>
        <SortHeaderButton text="Published" {...props} />
      </Flex>
    ),
    cell: ({cellProps, datum: document}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 130}}
      >
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
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border" style={{width: 100}}>
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            Contributors
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: document, cellProps}) => (
      <Flex
        {...cellProps}
        align="center"
        paddingX={2}
        paddingY={3}
        sizing="border"
        style={{width: 100}}
      >
        <AvatarStack maxLength={3} size={0}>
          {document.history?.editors?.map((userId) => <UserAvatar key={userId} user={userId} />)}
        </AvatarStack>
      </Flex>
    ),
  },
  {
    id: 'actions',
    sorting: false,
    header: ({headerProps}) => (
      <Flex {...headerProps} paddingY={3} sizing="border" style={{width: 49}}>
        <Box padding={2}>
          <Text muted size={1} weight="medium">
            &nbsp;
          </Text>
        </Box>
      </Flex>
    ),
    cell: ({datum: document, cellProps}) => (
      // Actions is empty - don't render yet
      <Flex {...cellProps} align="center" flex="none" padding={3}>
        <DocumentActions document={document} />
      </Flex>
    ),
  },
]
