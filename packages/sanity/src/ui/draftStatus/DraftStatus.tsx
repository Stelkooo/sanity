import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {Tooltip} from '..'
import {useTimeAgo} from 'sanity'

const StyledText = styled(Text)<{$hidden: boolean}>`
  opacity: ${({$hidden}) => ($hidden ? 0 : 1)};
`

// @todo: DRY with ui/PublishedStatus
export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  // Label with abbreviations and suffix
  const lastUpdatedTimeAgo = useTimeAgo(updatedAt || '', {minimal: true, agoSuffix: true})

  return (
    <Tooltip content={`Edited ${lastUpdatedTimeAgo}`} disabled={!document} portal>
      <StyledText $hidden={!document} muted size={1}>
        <EditIcon aria-label="Edited" />
      </StyledText>
    </Tooltip>
  )
}
