import {Subject} from 'rxjs'
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  usePortableTextEditor,
  HotkeyOptions,
  RenderAttributes,
  Type,
} from '@sanity/portable-text-editor'
import {isKeySegment, isValidationErrorMarker, isValidationWarningMarker} from '@sanity/types'
import {
  BoundaryElementProvider,
  Portal,
  PortalProvider,
  Text,
  useBoundaryElement,
  usePortal,
} from '@sanity/ui'
import {ChangeIndicatorWithProvidedFullPath} from '../../../components/changeIndicators'
import {PortableTextMarker, RenderCustomMarkers} from '../../types'
import {ActivateOnFocus} from '../../components/ActivateOnFocus/ActivateOnFocus'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ArrayFieldProps} from '../../store/types'
import {BlockObject} from './object/BlockObject'
import {InlineObject} from './object/InlineObject'
import {EditObject} from './object/EditObject'
import {Annotation, TextBlock} from './text'
import {RenderBlockActions} from './types'
import {Editor} from './Editor'
import {ExpandedLayer, Root} from './Compositor.styles'
import {useObjectEditData} from './hooks/useObjectEditData'
import {useScrollSelectionIntoView} from './hooks/useScrollSelectionIntoView'
import {useObjectEditFormBuilderFocus} from './hooks/useObjectEditFormBuilderFocus'
import {useObjectEditFormBuilderChange} from './hooks/useObjectEditFormBuilderChange'
import {useHotkeys} from './hooks/useHotKeys'
import {useScrollToFocusFromOutside} from './hooks/useScrollToFocusFromOutside'

interface InputProps extends Omit<ArrayFieldProps<PortableTextBlock>, 'type'> {
  hasFocus: boolean
  hotkeys?: HotkeyOptions
  isFullscreen: boolean
  markers: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
  patches$: Subject<EditorPatch>
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
}

const ACTIVATE_ON_FOCUS_MESSAGE = <Text weight="semibold">Click to activate</Text>

export function Compositor(props: InputProps) {
  const {
    focusPath = EMPTY_ARRAY,
    hasFocus,
    hotkeys,
    isFullscreen,
    markers,
    onChange,
    onCopy,
    onFocus,
    onPaste,
    onToggleFullscreen,
    patches$,
    presence,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    validation,
    value,
  } = props

  const editor = usePortableTextEditor()

  const [isActive, setIsActive] = useState(false)
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  const {element: boundaryElement} = useBoundaryElement()

  // References to editor HTML elements that points to externally edited data (blocks, annotations, inline-objects)
  const childEditorElementRef = useRef<HTMLSpanElement | null>(null)
  const blockObjectElementRef = useRef<HTMLDivElement | null>(null)
  const inlineObjectElementRef = useRef<HTMLDivElement | null>(null)

  // Data about the current object inside the modal that is non-text (annotations, objects)
  const objectEditData = useObjectEditData(focusPath, {
    block: blockObjectElementRef,
    child: childEditorElementRef,
    inline: inlineObjectElementRef,
  })

  // Various focus handling hooks
  const {onEditObjectFormBuilderFocus, onEditObjectFormBuilderBlur, onEditObjectClose} =
    useObjectEditFormBuilderFocus(onFocus)

  const {onObjectEditFormBuilderChange} = useObjectEditFormBuilderChange(onChange, patches$)

  // This is what PortableTextEditor will use to scroll the content into view when editing
  // inside the editor
  const scrollSelectionIntoView = useScrollSelectionIntoView(scrollElement)

  // This will scroll to the content when focusPath is set from the outside
  useScrollToFocusFromOutside(hasFocus, focusPath, objectEditData, scrollElement)

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus || focusPath.length > 1) {
      setIsActive(true)
    }
  }, [hasFocus, focusPath])

  const handleToggleFullscreen = useCallback(() => {
    onToggleFullscreen()
  }, [onToggleFullscreen])

  const hotkeysWithFullscreenToggle = useMemo(
    () => ({
      ...hotkeys,
      custom: {
        'mod+enter': onToggleFullscreen,
        ...(hotkeys?.custom || {}),
      },
    }),

    [hotkeys, onToggleFullscreen]
  )

  const editorHotkeys = useHotkeys(hotkeysWithFullscreenToggle)

  const focus = useCallback((): void => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      focus()
    }
  }, [focus, isActive])

  const editObjectKey = useMemo(() => {
    const last = objectEditData?.editorPath.slice(-1)[0]
    if (last && isKeySegment(last)) {
      return last._key
    }
    return null
  }, [objectEditData?.editorPath])

  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const hasContent = !!value

  const initialSelection = useMemo(
    (): EditorSelection =>
      focusPath.length > 0
        ? {
            anchor: {path: focusPath, offset: 0},
            focus: {path: focusPath, offset: 0},
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Empty!
  )

  const renderBlock = useCallback(
    (
      block: PortableTextBlock,
      blockType: Type,
      attributes: RenderAttributes,
      defaultRender: (b: PortableTextBlock) => JSX.Element
    ) => {
      const isTextBlock = block._type === ptFeatures.types.block.name
      const blockRef: React.RefObject<HTMLDivElement> = React.createRef()
      const blockMarkers = markers.filter(
        (msg) => isKeySegment(msg.path[0]) && msg.path[0]._key === block._key
      )

      const blockValidation = validation.filter(
        (msg) => isKeySegment(msg.path[0]) && msg.path[0]._key === block._key
      )

      if (isTextBlock) {
        return (
          <TextBlock
            attributes={attributes}
            block={block}
            blockRef={blockRef}
            isFullscreen={isFullscreen}
            markers={blockMarkers}
            validation={blockValidation}
            onChange={onChange}
            readOnly={readOnly}
            renderBlockActions={hasContent ? renderBlockActions : undefined}
            renderCustomMarkers={hasContent ? renderCustomMarkers : undefined}
          >
            {defaultRender(block)}
          </TextBlock>
        )
      }
      const useBlockObjectElementRef = block._key === editObjectKey
      return (
        <BlockObject
          attributes={attributes}
          block={block}
          blockRef={blockRef}
          editor={editor}
          isFullscreen={isFullscreen}
          markers={blockMarkers}
          validation={blockValidation}
          onChange={onChange}
          onFocus={onFocus}
          readOnly={readOnly}
          ref={useBlockObjectElementRef ? blockObjectElementRef : undefined}
          renderBlockActions={hasContent ? renderBlockActions : undefined}
          renderCustomMarkers={hasContent ? renderCustomMarkers : undefined}
          type={blockType}
        />
      )
    },
    [
      editObjectKey,
      editor,
      hasContent,
      isFullscreen,
      markers,
      onChange,
      onFocus,
      ptFeatures.types.block.name,
      readOnly,
      renderBlockActions,
      renderCustomMarkers,
      validation,
    ]
  )

  const renderChild = useCallback(
    (child, childType, attributes, defaultRender) => {
      const isSpan = child._type === ptFeatures.types.span.name
      const useRefElm = child._key === editObjectKey
      if (isSpan) {
        return (
          <span ref={useRefElm ? childEditorElementRef : undefined}>{defaultRender(child)}</span>
        )
      }
      const childMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === child._key
      )

      const childValidation = validation.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === child._key
      )

      return (
        <InlineObject
          attributes={attributes}
          isEditing={!!editObjectKey}
          markers={childMarkers}
          validation={childValidation}
          onFocus={onFocus}
          readOnly={readOnly}
          ref={useRefElm ? inlineObjectElementRef : undefined}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={childType}
          value={child}
        />
      )
    },
    [
      editObjectKey,
      markers,
      validation,
      onFocus,
      ptFeatures.types.span.name,
      readOnly,
      renderCustomMarkers,
      scrollElement,
    ]
  )

  const renderAnnotation = useCallback(
    (annotation, annotationType, attributes, defaultRender) => {
      const annotationMarkers = markers.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === annotation._key
      )

      const annotationValidation = validation.filter(
        (marker) => isKeySegment(marker.path[2]) && marker.path[2]._key === annotation._key
      )

      const hasError = annotationValidation.some(isValidationErrorMarker)
      const hasWarning = annotationValidation.some(isValidationWarningMarker)
      return (
        <Annotation
          attributes={attributes}
          hasError={hasError}
          hasWarning={hasWarning}
          markers={annotationMarkers}
          validation={annotationValidation}
          onFocus={onFocus}
          readOnly={readOnly}
          renderCustomMarkers={renderCustomMarkers}
          scrollElement={scrollElement}
          type={annotationType}
          value={annotation}
        >
          {defaultRender()}
        </Annotation>
      )
    },
    [markers, onFocus, readOnly, renderCustomMarkers, scrollElement, validation]
  )

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const editorNode = useMemo(
    () => (
      <Editor
        hotkeys={editorHotkeys}
        initialSelection={initialSelection}
        isFullscreen={isFullscreen}
        onFocus={onFocus}
        onCopy={onCopy}
        onPaste={onPaste}
        onToggleFullscreen={handleToggleFullscreen}
        readOnly={isActive === false || readOnly}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderChild={renderChild}
        setPortalElement={setPortalElement}
        scrollElement={scrollElement}
        scrollSelectionIntoView={scrollSelectionIntoView}
        setScrollElement={setScrollElement}
      />
    ),

    // Keep only stable ones here!
    [
      editorHotkeys,
      handleToggleFullscreen,
      initialSelection,
      isActive,
      isFullscreen,
      onCopy,
      onFocus,
      onPaste,
      readOnly,
      renderAnnotation,
      renderBlock,
      renderChild,
      scrollElement,
      scrollSelectionIntoView,
    ]
  )

  const boundaryElm = isFullscreen ? scrollElement : boundaryElement
  const editObjectNode = (
    <BoundaryElementProvider element={boundaryElm}>
      <EditObject
        focusPath={focusPath}
        objectEditData={objectEditData}
        validation={validation} // TODO: filter relevant?
        onBlur={onEditObjectFormBuilderBlur}
        onChange={onObjectEditFormBuilderChange}
        onClose={onEditObjectClose}
        onFocus={onEditObjectFormBuilderFocus}
        readOnly={readOnly}
        presence={presence}
        scrollElement={boundaryElm}
        value={value}
      />
    </BoundaryElementProvider>
  )

  const children = (
    <>
      {editorNode}
      {editObjectNode}
    </>
  )

  const portal = usePortal()
  const portalElements = useMemo(
    () => ({
      collapsed: wrapperElement,
      default: portal.element,
      editor: portalElement,
      expanded: portal.element,
    }),

    [portal.element, portalElement, wrapperElement]
  )

  return (
    <PortalProvider __unstable_elements={portalElements}>
      <ActivateOnFocus
        message={ACTIVATE_ON_FOCUS_MESSAGE}
        onActivate={handleActivate}
        isOverlayActive={!isActive}
      >
        <ChangeIndicatorWithProvidedFullPath
          compareDeep
          value={value}
          hasFocus={hasFocus && objectEditData === null}
          path={EMPTY_ARRAY}
        >
          <Root data-focused={hasFocus ? '' : undefined} data-read-only={readOnly ? '' : undefined}>
            <div data-wrapper="" ref={setWrapperElement}>
              <Portal __unstable_name={isFullscreen ? 'expanded' : 'collapsed'}>
                {/* TODO: Can we get rid of this DOM-rerender? */}
                {isFullscreen ? <ExpandedLayer>{children}</ExpandedLayer> : children}
              </Portal>
            </div>
            <div data-border="" />
          </Root>
        </ChangeIndicatorWithProvidedFullPath>
      </ActivateOnFocus>
    </PortalProvider>
  )
}
