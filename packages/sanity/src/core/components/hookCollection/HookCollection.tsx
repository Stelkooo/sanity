import {memo, type ReactNode, useCallback, useEffect, useMemo, useState} from 'react'

import {isNonNullable} from '../../util'
import {getHookId} from './actionId'
import {type ActionHook} from './types'

/** @internal */
export interface HookCollectionProps<T, K> {
  /**
   * Arguments that will be received by the action hooks, `onComplete` will be added by the HookStateContainer component.
   */
  args: T
  children: (props: {states: K[]}) => ReactNode
  hooks: ActionHook<T & {onComplete: () => void}, K>[]
  onReset?: () => void
  /**
   * Name for the hook group. If provided, only hooks with the same group name will be included in the collection.
   */
  group?: string
}

/** @internal */
export function HookCollection<T, K>(props: HookCollectionProps<T, K>) {
  const {hooks, args, children, group, onReset} = props

  const [state, setState] = useState<Record<string, {value: K}>>({})
  const [keys, setKeys] = useState<Record<string, number>>({})

  const handleNext = useCallback(
    (id: string, hookState: any) => {
      setState((prevState) => {
        const hookGroup = hookState?.group || ['default']
        let nextState
        if (hookState === null || (group && !hookGroup.includes(group))) {
          nextState = {...prevState}
          delete nextState[id]
        } else if (prevState[id]?.value !== hookState) {
          nextState = {...prevState, [id]: {...prevState[id], value: hookState}}
        }
        // If nextState is defined, then schedule an update, otherwise return prevState to make react no-op
        return nextState || prevState
      })
    },
    [group],
  )

  const handleReset = useCallback(
    (id: string) => {
      setKeys((currentKeys) => ({...currentKeys, [id]: (currentKeys[id] || 0) + 1}))
      onReset?.()
    },
    [onReset],
  )

  const hookIds = useMemo(() => hooks.map((hook) => getHookId(hook)), [hooks])
  const states = useMemo(
    () => hookIds.map((id) => state[id]?.value).filter(isNonNullable),
    [hookIds, state],
  )

  return (
    <>
      <HookCollectionState
        hooks={hooks as any}
        keys={keys}
        args={args}
        handleNext={handleNext}
        handleReset={handleReset}
      />
      {children({states})}
    </>
  )
}

const HookCollectionState = memo(
  function HookCollectionState<T, K>({
    hooks,
    keys,
    args,
    handleNext,
    handleReset,
  }: {
    hooks: ActionHook<T & {onComplete: () => void}, K>[]
    keys: Record<string, number>
    args: T
    handleNext: (id: string, hookState: any) => void
    handleReset: (id: string) => void
  }) {
    const HooksState = useMemo(() => {
      return hooks.map((hook) => {
        const id = getHookId(hook)
        const key = keys[id] || 0

        return [
          defineHookStateComponent<T, K>({
            hook,
            id,
          }),
          `${id}-${key}`,
        ] as const
      })
    }, [hooks, keys])

    return (
      <>
        {HooksState.map(([HookState, key]) => (
          <HookState key={key} args={args} handleNext={handleNext} handleReset={handleReset} />
        ))}
      </>
    )
  },
  // Only re-render if the args prop changes, ignore other prop changes
  (prev, next) => prev.args === next.args,
)

function defineHookStateComponent<T, K>({
  hook,
  id,
}: {
  hook: ActionHook<
    T & {
      onComplete: () => void
    },
    K
  >
  id: string
}) {
  const HookStateComponent = ({
    args,
    handleNext,
    handleReset,
  }: {
    args: T
    handleNext: (id: string, hookState: any) => void
    handleReset: (id: string) => void
  }) => {
    const hookState = hook({
      ...args,
      onComplete: () => {
        handleReset(id)
      },
    })

    useEffect(() => {
      handleNext(id, hookState)
      return () => {
        handleNext(id, null)
      }
    }, [handleNext, hookState])

    return null
  }
  // Massively helps debugging and profiling by setting the display name
  const [displayName] = id.split('-')
  HookStateComponent.displayName = displayName
  return HookStateComponent
}
