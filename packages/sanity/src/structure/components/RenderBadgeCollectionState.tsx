import {type ReactNode} from 'react'
import {
  type DocumentBadgeDescription,
  type DocumentBadgeProps,
  type EditStateFor,
  HookCollection,
} from 'sanity'

/** @internal */
export interface Badge<Args, Description> {
  (args: Args): Description | null
}

/** @internal */
export interface RenderBadgeCollectionProps {
  badges: Badge<DocumentBadgeProps, DocumentBadgeDescription>[]
  badgeProps: EditStateFor
  children: (props: {states: DocumentBadgeDescription[]}) => ReactNode
}

/** @internal */
export const RenderBadgeCollectionState = (props: RenderBadgeCollectionProps) => {
  const {badges, children, badgeProps} = props

  return (
    <HookCollection hooks={badges} args={badgeProps}>
      {children}
    </HookCollection>
  )
}
