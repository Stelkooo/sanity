import {type Path} from '@sanity/types'
import {isString} from 'sanity'

import {type CopyActionResult} from './types'

const SANITY_CLIPBOARD_ITEM_TYPE = isWebKit()
  ? 'text/plain'
  : 'web application/sanity-studio-clipboard-item'

export const getClipboardItem = async (): Promise<CopyActionResult | null> => {
  const items = await window.navigator.clipboard.read()
  const item = items.find((i) => i.types.includes(SANITY_CLIPBOARD_ITEM_TYPE))
  const sanityItem = await item?.getType(SANITY_CLIPBOARD_ITEM_TYPE)
  if (sanityItem) {
    const text = await sanityItem.text()
    return parseCopyResult(text) || null
  }
  return null
}

export const writeClipboardItem = async (copyActionResult: CopyActionResult): Promise<boolean> => {
  try {
    const clipboardItem: Record<string, Blob> = {
      [SANITY_CLIPBOARD_ITEM_TYPE]: new Blob([JSON.stringify(copyActionResult)], {
        type: SANITY_CLIPBOARD_ITEM_TYPE,
      }),
    }
    if (SANITY_CLIPBOARD_ITEM_TYPE !== 'text/plain') {
      const text = copyActionResult.items
        .map((item) => transformValueToText(item.value))
        .filter(Boolean)
        .join('\n')
      if (text.length > 0) {
        clipboardItem['text/plain'] = new Blob([text], {type: 'text/plain'})
      }
    }
    await window.navigator.clipboard.write([new ClipboardItem(clipboardItem)])
    return true
  } catch (error) {
    console.error(`Failed to write to clipboard: ${error.message}`, error)
    return false
  }
}

export function transformValueToText(value: unknown): string | number {
  if (!value) {
    return ''
  }
  if (isString(value)) {
    return value
  }

  if (Number.isFinite(value)) {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => transformValueToText(item))
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    return Object.keys(objectValue)
      .map((key) =>
        key.startsWith('_')
          ? ''
          : transformValueToText(typeof value === 'object' ? objectValue[key] : ''),
      )
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

export function parseCopyResult(value: string): CopyActionResult | null {
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

export function isNativeEditableElement(el: EventTarget): boolean {
  if (el instanceof HTMLElement && el.isContentEditable) return true
  if (el instanceof HTMLInputElement) {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types
    if (/|text|email|number|password|search|tel|url/.test(el.type || '')) {
      return !(el.disabled || el.readOnly)
    }
  }
  if (el instanceof HTMLTextAreaElement) return !(el.disabled || el.readOnly)
  return false
}

export function hasSelection(): boolean {
  if (typeof window === 'undefined' || !window.getSelection) {
    return false
  }

  const selection = window.getSelection()

  return selection !== null && !selection.isCollapsed
}

/** @internal */
export function isEmptyFocusPath(path: Path): boolean {
  return path.length === 0 || (path.length === 1 && path[0] === '')
}

function isWebKit(): boolean {
  return typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style
}
