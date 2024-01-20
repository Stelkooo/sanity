import {createContext} from 'react'

import {type CommentsSelectedPathContextValue} from './types'

export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
