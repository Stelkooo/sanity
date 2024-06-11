/* eslint-disable i18next/no-literal-string */
import {type ObjectFieldType} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import {type Cell, type CellContext, flexRender} from '@tanstack/react-table'
import {type MouseEventHandler, useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {useDocumentSheetListContext} from './DocumentSheetListProvider'
import {type DocumentSheetTableRow} from './types'

const DataCell = styled.td<{width: number}>`
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  width: ${({width}) => width}px;
  background-color: var(--card-bg-color);
`

const PinnedDataCell = styled(DataCell)`
  position: sticky;
  z-index: 2;
`

interface SheetListCellInnerProps extends CellContext<DocumentSheetTableRow, unknown> {
  fieldType: ObjectFieldType
}

type CellInputElement = HTMLInputElement | HTMLSelectElement
type InputRef = CellInputElement | null

/** @internal */
export function SheetListCellInner(props: SheetListCellInnerProps) {
  const {getValue, column, row, fieldType} = props
  const cellId = `cell-${column.id}-${row.index}`
  const [renderValue, setRenderValue] = useState<string>(getValue() as string)
  const [isDirty, setIsDirty] = useState(false)
  const inputRef = useRef<InputRef>(null)
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitFocusedCell,
  } = useDocumentSheetListContext()
  const cellState = getStateByCellId(column.id, row.index)

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setSelectedAnchorCell(column.id, row.index)
    focusAnchorCell()
  }, [column.id, focusAnchorCell, row.index, setSelectedAnchorCell])
  const {patchDocument} = props.table.options.meta || {}

  const handleProgrammaticFocus = () => {
    inputRef.current?.focus()
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.select()
    }
  }

  const handleOnMouseDown: MouseEventHandler<CellInputElement> = (event) => {
    if (event.detail === 2) {
      handleProgrammaticFocus()
    } else {
      event.preventDefault()
      setSelectedAnchorCell(column.id, row.index)
    }
  }

  const handleOnEnterDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event
      if (key === 'Enter') {
        if (cellState === 'selectedAnchor') handleProgrammaticFocus()
        if (cellState === 'focused') submitFocusedCell()
      }
    },
    [cellState, submitFocusedCell],
  )

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true)
    setRenderValue(event.target.value)
  }

  const handleOnBlur = () => {
    if (isDirty) {
      patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, renderValue)
      setIsDirty(false)
    }
    resetFocusSelection()
  }

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')

      if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
        setRenderValue(clipboardData)
        // patch immediately when pasting
        patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, clipboardData)
      }
    },
    [column.id, patchDocument, row.original.__metadata.idPair.publishedId],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(renderValue.toString())
  }, [renderValue])

  useEffect(() => {
    if (cellState === 'selectedAnchor' || cellState === 'focused')
      // only listen for enter key when cell is focused or anchor
      document.addEventListener('keydown', handleOnEnterDown)
    if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      // if cell is selected, paste events should be handled
      document.addEventListener('paste', handlePaste)

    if (cellState === 'selectedAnchor')
      // only allow copying when cell is selected anchor
      document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState === 'selectedAnchor' || cellState === 'focused')
        document.removeEventListener('keydown', handleOnEnterDown)
      if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
        document.removeEventListener('paste', handlePaste)
      if (cellState === 'selectedAnchor') document.removeEventListener('copy', handleCopy)
    }
  }, [
    cellId,
    cellState,
    column.id,
    getStateByCellId,
    handleCopy,
    handleOnEnterDown,
    handlePaste,
    row.index,
  ])

  const inputProps = {
    'onFocus': handleOnFocus,
    'onBlur': handleOnBlur,
    'onMouseDown': handleOnMouseDown,
    'aria-selected': !!cellState,
    'data-testid': cellId,
    'id': cellId,
    'ref': (ref: InputRef) => (inputRef.current = ref),
  }

  if (fieldType.name === 'boolean') {
    return (
      <Select
        {...inputProps}
        onChange={() => null}
        radius={0}
        style={{
          boxShadow: 'none',
          padding: 0,
        }}
        value={JSON.stringify(renderValue)}
      >
        <option value="True">True</option>
        <option value="False">False</option>
      </Select>
    )
  }

  return (
    <TextInput
      {...inputProps}
      size={0}
      radius={0}
      border={false}
      __unstable_disableFocusRing
      style={{
        padding: '22px 16px',
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={handleOnChange}
    />
  )
}

/** @internal */
export function SheetListCell(cell: Cell<DocumentSheetTableRow, unknown>) {
  const isPinned = cell.column.getIsPinned()
  const Cell = isPinned ? PinnedDataCell : DataCell

  const {getStateByCellId} = useDocumentSheetListContext()
  const cellState = getStateByCellId(cell.column.id, cell.row.index)

  const getStateStyles = () => {
    if (cellState) {
      return {
        // backgroundColor: 'var(--card-focus-ring-color)',
        border: '1px solid var(--card-focus-ring-color)',
        boxShadow:
          cellState === 'focused'
            ? 'inset 0px 0px 0px 1px var(--card-focus-ring-color)'
            : undefined,
      }
    }

    return {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'var(--card-border-color) var(--card-border-color) transparent transparent',
    }
  }

  return (
    <Cell
      key={cell.row.original._id + cell.id}
      style={{
        left: cell.column.getStart('left') ?? undefined,
        ...getStateStyles(),
      }}
      width={cell.column.getSize()}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext?.())}
    </Cell>
  )
}
