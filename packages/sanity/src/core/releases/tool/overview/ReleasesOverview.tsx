import {AddIcon} from '@sanity/icons'
import {Box, Button, type ButtonMode, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {isBefore} from 'date-fns'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useState} from 'react'

import {Button as StudioButton} from '../../../../ui-components'
import {CreateBundleDialog} from '../../../bundles/components/dialog/CreateBundleDialog'
import {useBundles} from '../../../store/bundles/useBundles'
import {type TableBundle} from '../../components/ReleasesTable/ReleasesTable'
import {Table} from '../../components/Table/Table'
import {containsBundles} from '../../types/bundle'
import {useBundlesMetadata} from '../useBundlesMetadata'
import {columnDefs} from './ReleaseTableColumnDefs'

type Mode = 'open' | 'archived'

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}

export function ReleasesOverview() {
  const {data: bundles, loading: loadingBundles} = useBundles()
  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const bundleSlugs = useMemo(() => bundles?.map((bundle) => bundle.name) || [], [bundles])
  const {data: bundlesMetadata, loading: loadingBundlesMetadata} = useBundlesMetadata(bundleSlugs)
  const loading = loadingBundles || loadingBundlesMetadata
  const hasBundles = bundles && containsBundles(bundles)
  const loadingOrHasBundles = loading || hasBundles

  const tableBundles = useMemo<TableBundle[]>(() => {
    if (!bundles || !bundlesMetadata) return []

    return bundles.map((bundle) => ({
      ...bundle,
      documentsMetadata: bundlesMetadata[bundle.name] || {},
    }))
  }, [bundles, bundlesMetadata])

  const groupedBundles = useMemo(
    () =>
      tableBundles.reduce<{open: TableBundle[]; archived: TableBundle[]}>((groups, bundle) => {
        const isBundleArchived =
          bundle.archivedAt ||
          (bundle.publishedAt && isBefore(new Date(bundle.publishedAt), new Date()))
        const group = isBundleArchived ? 'archived' : 'open'

        return {...groups, [group]: [...groups[group], bundle]}
      }, EMPTY_BUNDLE_GROUPS) || EMPTY_BUNDLE_GROUPS,
    [tableBundles],
  )

  // switch to open mode if on archived mode and there are no archived bundles
  useEffect(() => {
    if (bundleGroupMode === 'archived' && !groupedBundles.archived.length) {
      setBundleGroupMode('open')
    }
  }, [bundleGroupMode, groupedBundles.archived.length])

  const handleBundleGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setBundleGroupMode(groupMode as Mode)
    },
    [],
  )

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasBundles,
      mode: 'bleed' as ButtonMode,
      padding: 2,
    }
    return (
      <Flex flex="none" gap={1}>
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'open'}
          text="Open"
          value="open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <StudioButton
          {...groupModeButtonBaseProps}
          disabled={groupModeButtonBaseProps.disabled || !groupedBundles.archived.length}
          tooltipProps={{
            disabled: groupedBundles.archived.length !== 0,
            content: 'No archived releases',
            placement: 'bottom',
          }}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'archived'}
          text="Archived"
          value="archived"
        />
      </Flex>
    )
  }, [
    bundleGroupMode,
    groupedBundles.archived.length,
    handleBundleGroupModeChange,
    hasBundles,
    loading,
  ])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateBundleDialogOpen}
        onClick={() => setIsCreateBundleDialogOpen(true)}
        padding={2}
        space={2}
        text="Create release"
      />
    ),
    [isCreateBundleDialogOpen],
  )

  const renderCreateBundleDialog = () => {
    if (!isCreateBundleDialogOpen) return null

    return (
      <CreateBundleDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onCreate={() => setIsCreateBundleDialogOpen(false)}
      />
    )
  }

  const applySearchTermToBundles = useCallback(
    (unfilteredData: TableBundle[], tableSearchTerm: string) => {
      return unfilteredData.filter((bundle) => {
        return bundle.title.toLocaleLowerCase().includes(tableSearchTerm.toLocaleLowerCase())
      })
    },
    [],
  )

  return (
    <Card flex={1} overflow="auto">
      <Container width={3}>
        <Stack paddingX={4} paddingY={6} space={4}>
          <Flex align="flex-start" gap={2} paddingBottom={2}>
            <Flex align="flex-start" flex={1} gap={4}>
              <Stack paddingY={1} space={4}>
                <Heading as="h1" size={2} style={{margin: '1px 0'}}>
                  Releases
                </Heading>
                {!loading && !hasBundles && (
                  <Container style={{margin: 0}} width={0}>
                    <Stack space={5}>
                      <Text muted size={2}>
                        Releases are collections of document versions which can be managed and
                        published together.
                      </Text>
                      <Box>{createReleaseButton}</Box>
                    </Stack>
                  </Container>
                )}
              </Stack>
              {loadingOrHasBundles && currentArchivedPicker}
            </Flex>
            {loadingOrHasBundles && createReleaseButton}
          </Flex>
          <Table<TableBundle>
            key={bundleGroupMode}
            loading={loading}
            data={groupedBundles[bundleGroupMode]}
            columnDefs={columnDefs}
            searchFilterPredicate={applySearchTermToBundles}
            emptyState={'No Releases'}
            rowId="_id"
          />
        </Stack>
      </Container>
      {renderCreateBundleDialog()}
    </Card>
  )
}
