import {type BlockChildRenderProps, type RenderChildFunction} from '@sanity/portable-text-editor'
import React from 'react'

import {MentionInlineBlock} from '../blocks'

export const renderChild: RenderChildFunction = (childProps: BlockChildRenderProps) => {
  const {children, value, selected} = childProps

  const isMention = value._type === 'mention' && value.userId

  if (isMention) {
    return <MentionInlineBlock selected={selected} userId={value?.userId as string} />
  }

  return children
}
