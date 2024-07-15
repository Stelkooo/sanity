import {DocumentsIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {AvatarStack, Card, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {getPublishedId} from 'sanity'
import {IntentLink} from 'sanity/router'

import {
  BundleIconEditorPicker,
  type BundleIconEditorPickerValue,
} from '../../../bundles/components/dialog/BundleIconEditorPicker'
import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {type BundleDocument} from '../../../store/bundles/types'
import {useAddonDataset} from '../../../studio/addonDataset/useAddonDataset'
import {Chip} from '../../components/Chip'
import {Table} from '../../components/Table/Table'
import {type TableProps} from '../../components/Table/types'
import {useDocumentPreviewValues} from './documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {getReleaseSummaryColumnDefs} from './ReleaseSummaryColumnDefs'

export type DocumentWithHistory = SanityDocument & {history: DocumentHistory | undefined}

const getRow =
  (
    release: BundleDocument,
  ): TableProps<DocumentWithHistory, ReturnType<typeof useDocumentPreviewValues>>['Row'] =>
  ({children, searchTerm, datum}) => {
    const {previewValues, isLoading} = useDocumentPreviewValues({document: datum, release})

    if (searchTerm) {
      // Early return to filter out documents that don't match the search term
      const fallbackTitle = typeof document.title === 'string' ? document.title : 'Untitled'
      const title = typeof previewValues.title === 'string' ? previewValues.title : fallbackTitle
      if (!title.toLowerCase().includes(searchTerm.toLowerCase())) return null
    }

    return children({...datum, previewValues, isLoading})
  }

export function ReleaseSummary(props: {
  documents: SanityDocument[]
  documentsHistory: Map<string, DocumentHistory>
  collaborators: string[]
  release: BundleDocument
}) {
  const {documents, documentsHistory, release, collaborators} = props
  const {client} = useAddonDataset()

  const [iconValue, setIconValue] = useState<BundleIconEditorPickerValue>({
    hue: release.hue ?? 'gray',
    icon: release.icon ?? 'documents',
  })
  const toast = useToast()
  const handleIconValueChange = useCallback(
    async (value: {hue: BundleDocument['hue']; icon: BundleDocument['icon']}) => {
      if (!client) {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Failed to save changes',
          description: 'AddonDataset client not found',
        })
        return
      }

      setIconValue(value)
      try {
        await client?.patch(release._id).set(value).commit()
      } catch (e) {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Failed to save changes',
        })
      }
    },
    [client, release._id, toast],
  )

  const getLinkComponent = useCallback(
    (documentId: SanityDocument['_id'], documentTypeName: SanityDocument['_type']) =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId, true),
              type: documentTypeName,
            }}
            searchParams={[['perspective', `bundle.${release.name}`]]}
            ref={ref}
          />
        )
      }),
    [release.name],
  )

  const aggregatedData = useMemo(
    () =>
      documents.map((document) => ({
        ...document,
        history: documentsHistory.get(document._id),
      })),
    [documents, documentsHistory],
  )

  const releaseSummaryColumnDefs = useMemo(
    () => getReleaseSummaryColumnDefs(getLinkComponent),
    [getLinkComponent],
  )
  const Row = useMemo(() => getRow(release), [release])

  return (
    <Stack paddingX={4} space={5}>
      <Stack space={4}>
        <Flex>
          <BundleIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
        </Flex>

        <Heading size={2} style={{margin: '1px 0'}} as="h1">
          {release.title}
        </Heading>

        {release.description && (
          <Text muted size={2} style={{maxWidth: 600}}>
            {release.description}
          </Text>
        )}

        <Flex>
          <Flex flex={1} gap={2}>
            <Chip
              text={<>{documents.length} documents</>}
              icon={
                <Text size={1}>
                  <DocumentsIcon />
                </Text>
              }
            />

            {/* Created */}
            <Chip
              avatar={<UserAvatar size={0} user={release.authorId} />}
              text={
                <span>
                  Created <RelativeTime time={release._createdAt} useTemporalPhrase />
                </span>
              }
            />

            {/* Published */}
            {!release.archived && (
              <Chip
                avatar={
                  release.publishedBy ? <UserAvatar size={0} user={release.publishedBy} /> : null
                }
                text={
                  release.publishedAt ? (
                    <span>
                      Published <RelativeTime time={release.publishedAt} useTemporalPhrase />
                    </span>
                  ) : (
                    'Not published'
                  )
                }
              />
            )}

            {/* Contributors */}
            <div>
              <Card as="button" padding={1} radius="full">
                <AvatarStack size={0} style={{margin: -1}}>
                  {collaborators?.map((userId) => <UserAvatar key={userId} user={userId} />)}
                </AvatarStack>
              </Card>
            </div>
          </Flex>
        </Flex>
      </Stack>

      <Table<(typeof aggregatedData)[0], ReturnType<typeof useDocumentPreviewValues>>
        data={aggregatedData}
        loading={false}
        emptyState={'No documents'}
        rowId="_id"
        Row={Row}
        columnDefs={releaseSummaryColumnDefs}
      />
    </Stack>
  )
}
