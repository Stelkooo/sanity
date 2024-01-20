import {type TextInputProps} from '@sanity/ui'
import React, {type ChangeEvent, type HTMLProps, useCallback} from 'react'

import {LazyTextInput} from '../LazyTextInput'

export const YearInput = (
  props: {onChange: (year: number) => void} & TextInputProps &
    Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'ref'>,
) => {
  const {onChange, ...restProps} = props

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseInt(event.currentTarget.value, 10)
      if (!isNaN(numericValue)) {
        onChange(numericValue)
      }
    },
    [onChange],
  )

  return (
    <LazyTextInput
      {...restProps}
      fontSize={1}
      onChange={handleChange}
      inputMode="numeric"
      padding={2}
      radius={2}
    />
  )
}
